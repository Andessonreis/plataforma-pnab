import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { ruleSchema } from '@/lib/notifications/schemas'
import { isTriggerImplementado } from '@/lib/notifications/triggers'

export const runtime = 'nodejs'

const querySchema = z.object({
  ativo: z.enum(['true', 'false']).optional(),
})

export async function GET(req: NextRequest) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return forbidden(requestId)

    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const where =
      params.ativo === 'true' ? { ativo: true } : params.ativo === 'false' ? { ativo: false } : {}

    const rules = await prisma.notificationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { campaigns: true } },
      },
    })

    const res = NextResponse.json({ data: rules, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

export async function POST(req: NextRequest) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return forbidden(requestId)

    const body = await req.json()
    const data = ruleSchema.parse(body)

    // Bloqueia regras com trigger não implementado
    if (!isTriggerImplementado(data.trigger)) {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: `Trigger ${data.trigger} ainda não implementado.`,
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const rule = await prisma.notificationRule.create({
      data: {
        nome: data.nome,
        descricao: data.descricao ?? null,
        trigger: data.trigger,
        ativo: false, // sempre nasce desativada
        config: data.config as object,
        assunto: data.assunto,
        corpo: data.corpo,
        link: data.link ?? null,
        ctaLabel: data.ctaLabel ?? null,
        canais: data.canais,
        filtro: data.filtro as object,
        createdById: session.user.id,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.NOTIFICACAO_REGRA_CRIADA,
      entity: 'NotificationRule',
      entityId: rule.id,
      details: { nome: rule.nome, trigger: rule.trigger },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Regra criada (desativada).', id: rule.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

function forbidden(requestId: string) {
  const res = NextResponse.json(
    { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
    { status: 403 },
  )
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

function handleError(err: unknown, requestId: string) {
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
