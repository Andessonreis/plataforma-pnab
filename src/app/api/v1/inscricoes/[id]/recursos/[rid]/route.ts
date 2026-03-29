import { NextRequest } from 'next/server'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { recursoDecisaoSchema } from '@/lib/schemas/recurso'
import * as recursoService from '@/lib/services/recurso.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string; rid: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'HABILITADOR')) return forbidden(ctx)
    const { id, rid } = await params
    const data = recursoDecisaoSchema.parse(await req.json())
    await recursoService.decideRecurso(id, rid, data, caller.userId, getIp(req))
    logRequest(ctx, 'PUT', `/api/v1/inscricoes/${id}/recursos/${rid}`, 200)
    return ok(ctx, { message: 'Recurso decidido.' })
  } catch (err) {
    return handleError(ctx, err)
  }
}
