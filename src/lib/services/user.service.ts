import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { sendEmail } from '@/lib/mail'
import { ServiceError } from './errors'
import type { RegisterInput, UpdateProfileInput } from '@/lib/schemas/user'

export async function register(data: RegisterInput, ip?: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ cpfCnpj: data.cpfCnpj }, { email: data.email }] },
  })

  if (existing) {
    const campo = existing.cpfCnpj === data.cpfCnpj ? 'CPF/CNPJ' : 'E-mail'
    throw new ServiceError('CONFLICT', `${campo} já cadastrado.`)
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      nome: data.nome,
      cpfCnpj: data.cpfCnpj,
      email: data.email,
      telefone: data.telefone ?? null,
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero ?? null,
      complemento: data.complemento ?? null,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
      password: hashedPassword,
      tipoProponente: data.tipoProponente,
      role: 'PROPONENTE',
    },
  })

  await logAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.CADASTRO,
    entity: 'User',
    entityId: user.id,
    details: { tipoProponente: data.tipoProponente },
    ip,
  })

  return { userId: user.id }
}

export async function updateProfile(userId: string, data: UpdateProfileInput, ip?: string) {
  const updateData: Record<string, unknown> = {}

  if (data.nome) updateData.nome = data.nome
  if (data.cep !== undefined) updateData.cep = data.cep || null
  if (data.logradouro !== undefined) updateData.logradouro = data.logradouro || null
  if (data.numero !== undefined) updateData.numero = data.numero || null
  if (data.complemento !== undefined) updateData.complemento = data.complemento || null
  if (data.bairro !== undefined) updateData.bairro = data.bairro || null
  if (data.cidade !== undefined) updateData.cidade = data.cidade || null
  if (data.uf !== undefined) updateData.uf = data.uf || null
  if (data.telefone !== undefined) updateData.telefone = data.telefone || null

  if (data.newPassword && data.currentPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })
    if (!user) throw new ServiceError('NOT_FOUND', 'Usuário não encontrado.')

    const senhaValida = await bcrypt.compare(data.currentPassword, user.password)
    if (!senhaValida) throw new ServiceError('BAD_REQUEST', 'Senha atual incorreta.')

    updateData.password = await bcrypt.hash(data.newPassword, 12)
  }

  if (Object.keys(updateData).length === 0) {
    throw new ServiceError('BAD_REQUEST', 'Nenhum dado para atualizar.')
  }

  await prisma.user.update({ where: { id: userId }, data: updateData })

  await logAudit({
    userId,
    action: 'PERFIL_ATUALIZADO',
    entity: 'User',
    entityId: userId,
    details: { fields: Object.keys(updateData).filter((k) => k !== 'password') },
    ip,
  })
}

export async function requestPasswordReset(cpfCnpj?: string, email?: string, ip?: string) {
  const cpfCnpjLimpo = cpfCnpj?.replace(/\D/g, '')

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(cpfCnpjLimpo ? [{ cpfCnpj: cpfCnpjLimpo }] : []),
        ...(email ? [{ email }] : []),
      ],
      ativo: true,
    },
  })

  if (!user) return // Não revela se o usuário existe

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/recuperar-senha/reset?token=${token}`
  await sendEmail({
    to: user.email,
    subject: 'Recuperação de Senha — Portal PNAB Irecê',
    template: 'recuperacao_senha',
    data: { nome: user.nome, resetUrl, token },
  })

  await logAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SENHA_RESET_SOLICITADO,
    entity: 'User',
    entityId: user.id,
    ip,
  })
}

export async function resetPassword(token: string, newPassword: string, ip?: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new ServiceError('BAD_REQUEST', 'Link inválido ou expirado. Solicite uma nova recuperação de senha.')
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, id: { not: resetToken.id }, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ])

  await logAudit({
    userId: resetToken.userId,
    action: AUDIT_ACTIONS.SENHA_RESET_CONCLUIDO,
    entity: 'User',
    entityId: resetToken.userId,
    ip,
  })
}

export async function subscribeNewsletter(nome: string, email: string) {
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
  if (existing) {
    if (!existing.ativo) {
      await prisma.newsletterSubscriber.update({ where: { email }, data: { ativo: true } })
    }
    return
  }
  await prisma.newsletterSubscriber.create({ data: { nome, email } })
}
