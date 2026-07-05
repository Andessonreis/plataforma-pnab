import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

// ── Schema de validação ─────────────────────────────────────────────────────

const updateRoleSchema = z.object({
  role: z.enum(['PROPONENTE', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR', 'ADMIN']),
})

// ── PATCH — Alterar perfil de acesso (role) ─────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params

    if (id === session.user.id) {
      const res = NextResponse.json(
        { error: 'SELF_FORBIDDEN', message: 'Você não pode alterar o seu próprio perfil de acesso.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const { role } = updateRoleSchema.parse(body)

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    })

    if (!target) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (target.role !== role) {
      await prisma.user.update({ where: { id }, data: { role } })

      await logAudit({
        userId: session.user.id,
        action: 'USUARIO_ROLE_ALTERADA',
        entity: 'User',
        entityId: id,
        details: { de: target.role, para: role },
        ip: req.headers.get('x-forwarded-for') ?? undefined,
      })
    }

    const res = NextResponse.json(
      { message: 'Perfil de acesso atualizado.', requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PATCH',
      path: `/api/admin/users/${id}`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Perfil de acesso inválido.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
