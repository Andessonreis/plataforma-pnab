import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CHECK_TIMEOUT_MS = 3000

type CheckResult = 'ok' | 'fail' | 'timeout'

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    p.then((v) => { clearTimeout(timer); resolve(v) })
     .catch((e) => { clearTimeout(timer); reject(e) })
  })
}

async function checkDb(): Promise<CheckResult> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, CHECK_TIMEOUT_MS)
    return 'ok'
  } catch (err) {
    if (err instanceof Error && err.message === 'timeout') return 'timeout'
    return 'fail'
  }
}

async function checkRedis(): Promise<CheckResult> {
  try {
    const reply = await withTimeout(redis.ping(), CHECK_TIMEOUT_MS)
    return reply === 'PONG' ? 'ok' : 'fail'
  } catch (err) {
    if (err instanceof Error && err.message === 'timeout') return 'timeout'
    return 'fail'
  }
}

export async function GET() {
  const requestId = randomUUID()
  const start = Date.now()

  const [db, redisStatus] = await Promise.all([checkDb(), checkRedis()])
  const allOk = db === 'ok' && redisStatus === 'ok'

  const body = {
    status: allOk ? 'ok' : 'degraded',
    checks: { db, redis: redisStatus },
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version ?? 'unknown',
    timestamp: new Date().toISOString(),
    requestId,
    durationMs: Date.now() - start,
  }

  const res = NextResponse.json(body, { status: allOk ? 200 : 503 })
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
