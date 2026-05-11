import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

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

    // Cancelamento permitido só se ainda não disparou nenhuma entrega
    if (campaign.status === 'ENVIADA' || campaign.status === 'CANCELADA') {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: 'Campanha já foi enviada ou cancelada.',
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (campaign.totalEnviado > 0) {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: `Já foram entregues ${campaign.totalEnviado} notificações — não é mais possível cancelar.`,
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.notificationCampaign.update({
      where: { id },
      data: { status: 'CANCELADA' },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_CANCELADA,
      entity: 'NotificationCampaign',
      entityId: id,
      details: { titulo: campaign.titulo, statusAnterior: campaign.status },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ message: 'Campanha cancelada.', requestId })
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
