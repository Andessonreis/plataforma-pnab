import { NextRequest } from 'next/server'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { habilitacaoSchema } from '@/lib/schemas/habilitacao'
import * as habilitacaoService from '@/lib/services/habilitacao.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'HABILITADOR')) return forbidden(ctx)
    const { id } = await params
    const data = habilitacaoSchema.parse(await req.json())
    await habilitacaoService.updateHabilitacao(id, data, caller.userId, getIp(req))
    logRequest(ctx, 'PUT', `/api/v1/inscricoes/${id}/habilitacao`, 200)
    return ok(ctx, { message: 'Habilitação atualizada.' })
  } catch (err) {
    return handleError(ctx, err)
  }
}
