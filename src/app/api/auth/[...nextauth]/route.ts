import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

export const { GET } = handlers

// Wrap POST com rate limiting: 10 req/min
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'auth/login', RATE_LIMITS['auth/login'])
  if (limited) return limited

  return handlers.POST(req)
}
