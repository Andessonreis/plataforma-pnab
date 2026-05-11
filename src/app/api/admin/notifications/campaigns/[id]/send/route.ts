import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueCampaignDispatch } from '@/lib/queue'
import { countAudience } from '@/lib/notifications/audience'
import type { AudienceFilter } from '@/lib/notifications/types'

export const runtime = 'nodejs'

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

    const campaign = await prisma.notificationCampaign.findUnique({ where: { id } })
    if (!campaign) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Campanha não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (campaign.status !== 'RASCUNHO') {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: 'Apenas campanhas em RASCUNHO podem ser disparadas.',
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Confirmação de audiência mínima — proteção extra
    const totalAlvo = await countAudience((campaign.filtro ?? {}) as AudienceFilter)
    if (totalAlvo === 0) {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: 'Audiência vazia — nenhum usuário se encaixa no filtro.',
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await enqueueCampaignDispatch({ campaignId: campaign.id })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_DISPARADA,
      entity: 'NotificationCampaign',
      entityId: campaign.id,
      details: {
        titulo: campaign.titulo,
        totalAlvo,
        canais: campaign.canais,
        // snapshot do filtro pra trilha de auditoria
        filtro: campaign.filtro,
      },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({
      message: 'Disparo enfileirado.',
      id: campaign.id,
      totalAlvo,
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
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
