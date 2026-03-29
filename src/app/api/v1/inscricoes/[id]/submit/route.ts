import { NextRequest } from 'next/server'
import { createContext, ok, handleError, unauthorized, logRequest } from '@/lib/api/response'
import { resolveAuth, requireAnyAuth, getIp } from '@/lib/api/auth-resolver'
import * as inscricaoService from '@/lib/services/inscricao.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const { id } = await params
    const result = await inscricaoService.submitInscricao(id, caller.userId, getIp(req))
    logRequest(ctx, 'POST', `/api/v1/inscricoes/${id}/submit`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
