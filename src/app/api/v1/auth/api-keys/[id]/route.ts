import { NextRequest } from 'next/server'
import { createContext, ok, handleError, unauthorized, logRequest } from '@/lib/api/response'
import { resolveAuth, requireAnyAuth } from '@/lib/api/auth-resolver'
import * as apikeyService from '@/lib/services/apikey.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const { id } = await params
    await apikeyService.revokeApiKey(id, caller.userId)
    logRequest(ctx, 'DELETE', `/api/v1/auth/api-keys/${id}`, 200)
    return ok(ctx, { message: 'API key revogada.' })
  } catch (err) {
    return handleError(ctx, err)
  }
}
