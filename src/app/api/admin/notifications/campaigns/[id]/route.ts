import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@server/lib/audit'
import { campaignSchema } from '@shared/schemas/notifications.schema'

export const runtime = 'nodejs'

// ── GET — Detalhe da campanha ───────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return forbidden(requestId)
    }

    const { id } = await params

    const campaign = await prisma.notificationCampaign.findUnique({
      where: { id },
      include: {
        rule: { select: { id: true, nome: true } },
        createdBy: { select: { id: true, nome: true } },
      },
    })

    if (!campaign) return notFound(requestId)

    const res = NextResponse.json({ data: campaign, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

// ── PUT — Atualizar campanha (só RASCUNHO) ──────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return forbidden(requestId)
    }

    const { id } = await params
    const existing = await prisma.notificationCampaign.findUnique({ where: { id } })
    if (!existing) return notFound(requestId)

    if (existing.status !== 'RASCUNHO') {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: 'Apenas campanhas em RASCUNHO podem ser editadas.',
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = campaignSchema.parse(body)

    const campaign = await prisma.notificationCampaign.update({
      where: { id },
      data: {
        titulo: data.titulo,
        assunto: data.assunto,
        corpo: data.corpo,
        link: data.link ?? null,
        ctaLabel: data.ctaLabel ?? null,
        canais: data.canais,
        filtro: data.filtro as object,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_ATUALIZADA,
      entity: 'NotificationCampaign',
      entityId: campaign.id,
      details: { titulo: campaign.titulo },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ message: 'Campanha atualizada.', id: campaign.id, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

// ── DELETE — Excluir campanha (só RASCUNHO ou FALHA) ────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return forbidden(requestId)
    }

    const { id } = await params
    const existing = await prisma.notificationCampaign.findUnique({ where: { id } })
    if (!existing) return notFound(requestId)

    if (existing.status !== 'RASCUNHO' && existing.status !== 'FALHA') {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: 'Apenas campanhas em RASCUNHO ou FALHA podem ser excluídas.',
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.notificationCampaign.delete({ where: { id } })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_EXCLUIDA,
      entity: 'NotificationCampaign',
      entityId: id,
      details: { titulo: existing.titulo },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ message: 'Campanha excluída.', requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
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

function notFound(requestId: string) {
  const res = NextResponse.json(
    { error: 'NOT_FOUND', message: 'Campanha não encontrada.', requestId },
    { status: 404 },
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
