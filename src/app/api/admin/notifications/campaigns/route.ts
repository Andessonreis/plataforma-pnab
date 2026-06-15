import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@server/lib/audit'
import { campaignSchema } from '@shared/schemas/notifications.schema'

export const runtime = 'nodejs'

// ── GET — Listar campanhas ──────────────────────────────────────────────────

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z
    .enum(['RASCUNHO', 'ENVIANDO', 'ENVIADA', 'CANCELADA', 'FALHA'])
    .optional(),
})

export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return forbidden(requestId)
    }

    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const { page, pageSize, status } = params

    const where = status ? { status } : {}

    const [data, total] = await Promise.all([
      prisma.notificationCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { rule: { select: { id: true, nome: true } } },
      }),
      prisma.notificationCampaign.count({ where }),
    ])

    const res = NextResponse.json({
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/notifications/campaigns',
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

// ── POST — Criar campanha (RASCUNHO) ────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return forbidden(requestId)
    }

    const body = await req.json()
    const data = campaignSchema.parse(body)

    const campaign = await prisma.notificationCampaign.create({
      data: {
        tipo: 'MANUAL',
        status: 'RASCUNHO',
        titulo: data.titulo,
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
      action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_CRIADA,
      entity: 'NotificationCampaign',
      entityId: campaign.id,
      details: { titulo: campaign.titulo, canais: campaign.canais },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Campanha criada.', id: campaign.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/notifications/campaigns',
      status: 201,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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
    for (const e of err.errors) {
      fieldErrors[e.path.join('.')] = e.message
    }
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
