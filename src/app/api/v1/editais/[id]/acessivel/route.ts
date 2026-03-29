import { NextRequest } from 'next/server'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { editalAcessivelSchema } from '@/lib/schemas/edital'
import * as editalService from '@/lib/services/edital.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const { id } = await params
    const data = editalAcessivelSchema.parse(await req.json())
    await editalService.updateAcessivel(id, data, caller.userId, getIp(req))
    logRequest(ctx, 'PUT', `/api/v1/editais/${id}/acessivel`, 200)
    return ok(ctx, { message: 'Conteúdo acessível salvo.' })
  } catch (err) {
    return handleError(ctx, err)
  }
}
