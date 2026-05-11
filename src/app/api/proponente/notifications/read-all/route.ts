import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session) {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const result = await prisma.notification.updateMany({
      where: { userId: session.user.id, lidaEm: null },
      data: { lidaEm: new Date() },
    })

    const res = NextResponse.json({ updated: result.count, requestId })
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
