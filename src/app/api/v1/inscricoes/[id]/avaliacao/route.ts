import { NextRequest } from 'next/server'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole } from '@/lib/api/auth-resolver'
import { avaliacaoBodySchema } from '@/lib/schemas/avaliacao'
import * as avaliacaoService from '@/lib/services/avaliacao.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'AVALIADOR')) return forbidden(ctx)
    const { id } = await params
    const result = await avaliacaoService.getAvaliacao(id, caller.userId, caller.role === 'ADMIN')
    logRequest(ctx, 'GET', `/api/v1/inscricoes/${id}/avaliacao`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'AVALIADOR')) return forbidden(ctx)
    const { id } = await params
    const data = avaliacaoBodySchema.parse(await req.json())
    const result = await avaliacaoService.saveAvaliacao(id, data, caller.userId, caller.role === 'ADMIN')
    logRequest(ctx, 'PUT', `/api/v1/inscricoes/${id}/avaliacao`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
