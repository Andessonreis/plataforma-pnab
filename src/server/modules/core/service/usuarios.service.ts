import { createHash, randomBytes } from 'crypto'
import { AUDIT_ACTIONS, logAudit } from '@server/lib/audit'
import { enqueueEmail } from '@server/lib/queue'
import { sendEmail } from '@server/lib/mail'
import { hashPassword } from '@server/lib/auth/password'
import { usuariosRepository } from '../repository/usuarios.repository'
import {
  TokenRecuperacaoInvalidoError,
  UsuarioJaCadastradoError,
} from '../errors/usuarios.errors'
import type { CadastroInput } from '@shared/schemas/usuarios.schema'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? ''
}

export const usuariosService = {
  async cadastrar(input: CadastroInput, ctx: { ip?: string | null }) {
    const existing = await usuariosRepository.findByCpfCnpjOrEmail(input.cpfCnpj, input.email)
    if (existing) {
      throw new UsuarioJaCadastradoError()
    }

    const passwordHash = await hashPassword(input.password)

    const user = await usuariosRepository.create({
      nome: input.nome,
      cpfCnpj: input.cpfCnpj,
      email: input.email,
      telefone: input.telefone ?? null,
      cep: input.cep,
      logradouro: input.logradouro,
      numero: input.numero ?? null,
      complemento: input.complemento ?? null,
      bairro: input.bairro,
      cidade: input.cidade,
      uf: input.uf,
      password: passwordHash,
      tipoProponente: input.tipoProponente,
      role: 'PROPONENTE',
    })

    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.CADASTRO,
      entity: 'User',
      entityId: user.id,
      details: { tipoProponente: input.tipoProponente },
      ip: ctx.ip ?? undefined,
    })

    try {
      await enqueueEmail({
        to: user.email,
        template: 'boas_vindas',
        data: { nome: user.nome, url: `${siteUrl()}/proponente` },
      })
    } catch (err) {
      console.error({ warn: 'enqueue_boas_vindas_failed', error: err instanceof Error ? err.message : 'Unknown' })
    }

    return { id: user.id, email: user.email, nome: user.nome }
  },

  async solicitarRecuperacaoSenha(
    args: { cpfCnpj?: string; email?: string },
    ctx: { ip?: string | null },
  ): Promise<void> {
    const cpfCnpjLimpo = args.cpfCnpj?.replace(/\D/g, '')
    const user = await usuariosRepository.findByEmailOrCpfCnpjActive({
      cpfCnpj: cpfCnpjLimpo,
      email: args.email,
    })

    if (!user) return // não vazar existência

    const rawToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await usuariosRepository.createResetToken(user.id, hashResetToken(rawToken), expiresAt)

    const resetUrl = `${siteUrl()}/recuperar-senha/reset?token=${rawToken}`
    await sendEmail({
      to: user.email,
      subject: 'Recuperação de Senha — Portal PNAB Irecê',
      template: 'recuperacao_senha',
      data: { nome: user.nome, resetUrl, token: rawToken },
    })

    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.SENHA_RESET_SOLICITADO,
      entity: 'User',
      entityId: user.id,
      ip: ctx.ip ?? undefined,
    })
  },

  async redefinirSenha(
    args: { token: string; password: string },
    ctx: { ip?: string | null },
  ): Promise<void> {
    const record = await usuariosRepository.findResetTokenByHash(hashResetToken(args.token))
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new TokenRecuperacaoInvalidoError()
    }

    const passwordHash = await hashPassword(args.password)
    await usuariosRepository.consumeResetTokenAndUpdatePassword({
      tokenId: record.id,
      userId: record.userId,
      passwordHash,
    })

    await logAudit({
      userId: record.userId,
      action: AUDIT_ACTIONS.SENHA_RESET_CONCLUIDO,
      entity: 'User',
      entityId: record.userId,
      ip: ctx.ip ?? undefined,
    })
  },
}
