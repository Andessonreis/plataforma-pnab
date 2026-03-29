import { NextRequest } from 'next/server'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole } from '@/lib/api/auth-resolver'
import * as avaliacaoService from '@/lib/services/avaliacao.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const avaliadores = await avaliacaoService.listAvaliadores()
    logRequest(ctx, 'GET', '/api/v1/avaliadores', 200)
    return ok(ctx, avaliadores)
  } catch (err) {
    return handleError(ctx, err)
  }
}
