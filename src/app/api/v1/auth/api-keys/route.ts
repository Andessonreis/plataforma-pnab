import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, ok, created, handleError, unauthorized, logRequest } from '@/lib/api/response'
import { resolveAuth, requireAnyAuth } from '@/lib/api/auth-resolver'
import * as apikeyService from '@/lib/services/apikey.service'

export const runtime = 'nodejs'

const createSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  scopes: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
})

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const keys = await apikeyService.listApiKeys(caller.userId)
    logRequest(ctx, 'GET', '/api/v1/auth/api-keys', 200)
    return ok(ctx, keys)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const data = createSchema.parse(await req.json())
    const result = await apikeyService.createApiKey(
      caller.userId,
      data.label,
      data.scopes,
      data.expiresAt ? new Date(data.expiresAt) : undefined,
    )
    logRequest(ctx, 'POST', '/api/v1/auth/api-keys', 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
