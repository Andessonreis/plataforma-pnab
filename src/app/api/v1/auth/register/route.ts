import { NextRequest } from 'next/server'
import { createContext, created, handleError, logRequest } from '@/lib/api/response'
import { getIp } from '@/lib/api/auth-resolver'
import { registerSchema } from '@shared/schemas/user.schema'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import * as userService from '@/lib/services/user.service'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const limited = await rateLimit(req, 'auth/register', RATE_LIMITS['auth/register'])
    if (limited) return limited
    const data = registerSchema.parse(await req.json())
    const result = await userService.register(data, getIp(req))
    logRequest(ctx, 'POST', '/api/v1/auth/register', 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
