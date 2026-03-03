import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

const profileSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no minimo 3 caracteres').optional(),
  email: z.string().email('E-mail invalido').optional(),
  telefone: z.string().optional(),
  cep: z.string().max(8).optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Senha deve ter no minimo 8 caracteres').optional(),
}).refine(
  (data) => {
    // Se informou newPassword, precisa de currentPassword
    if (data.newPassword && !data.currentPassword) return false
    return true
  },
  { message: 'Senha atual e obrigatoria para alterar a senha.', path: ['currentPassword'] },
)

export async function PUT(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session) {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Nao autenticado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = profileSchema.parse(body)

    const userId = session.user.id
    const updateData: Record<string, unknown> = {}

    // Atualizar dados basicos
    if (data.nome) updateData.nome = data.nome
    if (data.cep !== undefined) updateData.cep = data.cep || null
    if (data.logradouro !== undefined) updateData.logradouro = data.logradouro || null
    if (data.numero !== undefined) updateData.numero = data.numero || null
    if (data.complemento !== undefined) updateData.complemento = data.complemento || null
    if (data.bairro !== undefined) updateData.bairro = data.bairro || null
    if (data.cidade !== undefined) updateData.cidade = data.cidade || null
    if (data.uf !== undefined) updateData.uf = data.uf || null
    if (data.email) {
      // Verificar se email ja existe para outro usuario
      const existingEmail = await prisma.user.findFirst({
        where: { email: data.email, id: { not: userId } },
      })
      if (existingEmail) {
        const res = NextResponse.json(
          { error: 'CONFLICT', message: 'Este e-mail ja esta em uso.', requestId },
          { status: 409 },
        )
        res.headers.set('X-Request-Id', requestId)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }
      updateData.email = data.email
    }
    if (data.telefone !== undefined) updateData.telefone = data.telefone || null

    // Alterar senha
    if (data.newPassword && data.currentPassword) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      })

      if (!user) {
        const res = NextResponse.json(
          { error: 'NOT_FOUND', message: 'Usuario nao encontrado.', requestId },
          { status: 404 },
        )
        res.headers.set('X-Request-Id', requestId)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }

      const senhaValida = await bcrypt.compare(data.currentPassword, user.password)
      if (!senhaValida) {
        const res = NextResponse.json(
          { error: 'INVALID_PASSWORD', message: 'Senha atual incorreta.', requestId },
          { status: 400 },
        )
        res.headers.set('X-Request-Id', requestId)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }

      updateData.password = await bcrypt.hash(data.newPassword, 12)
    }

    if (Object.keys(updateData).length === 0) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Nenhum dado para atualizar.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    await logAudit({
      userId,
      action: 'PERFIL_ATUALIZADO',
      entity: 'User',
      entityId: userId,
      details: { fields: Object.keys(updateData).filter((k) => k !== 'password') },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ message: 'Perfil atualizado com sucesso.', requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: '/api/proponente/perfil',
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const e of err.errors) {
        const field = e.path.join('.')
        fieldErrors[field] = e.message
      }
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados invalidos.', fieldErrors, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({
      requestId,
      error: err instanceof Error ? err.message : 'Unknown',
    })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
