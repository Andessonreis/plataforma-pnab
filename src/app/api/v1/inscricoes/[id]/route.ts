import { NextRequest } from 'next/server'
import { createContext, ok, handleError, unauthorized, logRequest } from '@/lib/api/response'
import { resolveAuth, requireAnyAuth } from '@/lib/api/auth-resolver'
import { updateInscricaoSchema } from '@/lib/schemas/inscricao'
import * as inscricaoService from '@/lib/services/inscricao.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const { id } = await params
    const inscricao = await inscricaoService.getInscricaoById(id, caller.userId, caller.role)
    logRequest(ctx, 'GET', `/api/v1/inscricoes/${id}`, 200)
    return ok(ctx, inscricao)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const { id } = await params
    const data = updateInscricaoSchema.parse(await req.json())
    const result = await inscricaoService.updateInscricao(id, data, caller.userId)
    logRequest(ctx, 'PUT', `/api/v1/inscricoes/${id}`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
