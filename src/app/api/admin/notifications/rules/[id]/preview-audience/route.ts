import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { countAudience } from '@server/lib/notifications/audience'
import type { AudienceFilter } from '@server/lib/notifications/types'

export const runtime = 'nodejs'

/**
 * Preview da audiência adicional configurada na regra (apenas filtro estático).
 * Não executa o trigger — não temos o evento (ex: editalId) ainda.
 */
export async function POST(
  _req: NextRequest,
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

    const rule = await prisma.notificationRule.findUnique({
      where: { id },
      select: { id: true, filtro: true },
    })

    if (!rule) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Regra não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const total = await countAudience((rule.filtro ?? {}) as AudienceFilter)

    const res = NextResponse.json({ total, requestId })
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
