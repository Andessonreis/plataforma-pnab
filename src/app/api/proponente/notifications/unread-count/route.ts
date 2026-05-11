import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session) {
      const res = NextResponse.json(
        { count: 0, requestId },
        { status: 200 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const count = await prisma.notification.count({
      where: { userId: session.user.id, lidaEm: null },
    })

    const res = NextResponse.json({ count, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json({ count: 0, requestId }, { status: 200 })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
