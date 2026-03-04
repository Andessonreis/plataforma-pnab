import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { purgeOldAuditLogs, getRetentionDays } from '@/lib/audit'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/admin/logs/purge
 * Remove logs de auditoria.
 * - Sem params: remove apenas logs mais antigos que AUDIT_RETENTION_DAYS
 * - ?force=true: remove TODOS os logs (requer confirmacao no cliente)
 * Acesso restrito: apenas ADMIN.
 */
export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

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

    let removidos: number
    if (force) {
      const result = await prisma.auditLog.deleteMany({})
      removidos = result.count
    } else {
      removidos = await purgeOldAuditLogs()
    }

    const res = NextResponse.json({
      message: `${removidos} log(s) removido(s).`,
      removidos,
      retentionDays: force ? null : getRetentionDays(),
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/logs/purge',
      force,
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    console.error({
      requestId,
      error: err instanceof Error ? err.message : 'Unknown',
    })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
