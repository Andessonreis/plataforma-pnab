import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'

export const runtime = 'nodejs'

function getRetentionDays(): number {
  const env = process.env.ERROR_LOG_RETENTION_DAYS
  if (env) {
    const parsed = parseInt(env, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 30
}

/**
 * POST /api/admin/logs/erros/purge
 * Remove logs de erro.
 * - Sem params: remove apenas logs mais antigos que ERROR_LOG_RETENTION_DAYS (default: 30d)
 * - ?force=true: remove TODOS os logs
 */
export async function POST(req: NextRequest) {
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

    const force = new URL(req.url).searchParams.get('force') === 'true'
    const retentionDays = getRetentionDays()

    let removidos: number
    if (force) {
      const result = await prisma.errorLog.deleteMany({})
      removidos = result.count
    } else {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - retentionDays)
      const result = await prisma.errorLog.deleteMany({
        where: { timestamp: { lt: cutoff } },
      })
      removidos = result.count
    }

    const res = NextResponse.json({
      message: `${removidos} log(s) de erro removido(s).`,
      removidos,
      retentionDays: force ? null : retentionDays,
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
