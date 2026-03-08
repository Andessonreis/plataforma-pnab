import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import type { RateLimitConfig } from './config'

/**
 * Rate limiting via sliding window com Redis sorted sets.
 *
 * Algoritmo:
 * 1. Remove entradas fora da janela (ZREMRANGEBYSCORE)
 * 2. Conta entradas restantes (ZCARD)
 * 3. Se abaixo do limite, adiciona nova entrada (ZADD)
 * 4. Define TTL na chave (EXPIRE)
 *
 * Retorna null se permitido, ou NextResponse 429 se bloqueado.
 */
export async function rateLimit(
  req: NextRequest,
  endpoint: string,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const key = `rate-limit:${endpoint}:${ip}`
  const now = Date.now()
  const windowMs = config.window * 1000
  const windowStart = now - windowMs

  try {
    // Pipeline atômico
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(key, 0, windowStart)
    pipeline.zcard(key)
    pipeline.zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`)
    pipeline.expire(key, config.window)

    const results = await pipeline.exec()
    if (!results) return null

    const count = (results[1]?.[1] as number) ?? 0

    if (count >= config.max) {
      // Remove a entrada que acabamos de adicionar (acima do limite)
      pipeline.zremrangebyscore(key, now, now)

      const retryAfter = Math.ceil(config.window)
      const res = NextResponse.json(
        {
          error: 'TOO_MANY_REQUESTS',
          message: 'Muitas requisições. Tente novamente em breve.',
        },
        { status: 429 },
      )
      res.headers.set('Retry-After', String(retryAfter))
      res.headers.set('X-RateLimit-Limit', String(config.max))
      res.headers.set('X-RateLimit-Remaining', '0')
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    return null
  } catch (err) {
    // Se Redis falhar, permite a requisição (fail-open)
    console.error('[rate-limit] Erro Redis:', err instanceof Error ? err.message : 'Unknown')
    return null
  }
}
