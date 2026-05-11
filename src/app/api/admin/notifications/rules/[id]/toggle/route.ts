import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { isTriggerImplementado } from '@/lib/notifications/triggers'

export const runtime = 'nodejs'

const bodySchema = z.object({ ativo: z.boolean() })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

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
    const body = await req.json()
    const { ativo } = bodySchema.parse(body)

    const existing = await prisma.notificationRule.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Regra não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Bloqueia ativação de trigger não implementado
    if (ativo && !isTriggerImplementado(existing.trigger)) {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: `Trigger ${existing.trigger} ainda não implementado — não é possível ativar.`,
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const rule = await prisma.notificationRule.update({
      where: { id },
      data: { ativo },
    })

    await logAudit({
      userId: session.user.id,
      action: ativo
        ? AUDIT_ACTIONS.NOTIFICACAO_REGRA_ATIVADA
        : AUDIT_ACTIONS.NOTIFICACAO_REGRA_DESATIVADA,
      entity: 'NotificationRule',
      entityId: rule.id,
      details: { nome: rule.nome, trigger: rule.trigger },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({
      message: ativo ? 'Regra ativada.' : 'Regra desativada.',
      id: rule.id,
      ativo: rule.ativo,
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const e of err.errors) fieldErrors[e.path.join('.')] = e.message
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', fieldErrors, requestId },
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
