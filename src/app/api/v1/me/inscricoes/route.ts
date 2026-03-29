import { NextRequest } from 'next/server'
import { createContext, okPaginated, created, handleError, unauthorized, logRequest } from '@/lib/api/response'
import { resolveAuth, requireAnyAuth, getIp } from '@/lib/api/auth-resolver'
import { createInscricaoSchema, listInscricaoSchema } from '@/lib/schemas/inscricao'
import * as inscricaoService from '@/lib/services/inscricao.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const params = listInscricaoSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const result = await inscricaoService.listInscricoesByProponente(caller.userId, params.page, params.pageSize)
    logRequest(ctx, 'GET', '/api/v1/me/inscricoes', 200)
    return okPaginated(ctx, result.data, result.meta)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const data = createInscricaoSchema.parse(await req.json())
    const result = await inscricaoService.createInscricao(data, caller.userId, getIp(req))
    logRequest(ctx, 'POST', '/api/v1/me/inscricoes', 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
