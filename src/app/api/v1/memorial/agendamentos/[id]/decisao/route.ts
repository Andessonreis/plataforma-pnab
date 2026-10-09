import { NextRequest } from 'next/server'
import { createContext, forbidden, handleError, logRequest, ok } from '@/lib/api/response'
import { getIp, requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { decidirVisitaSchema } from '@/lib/schemas/memorial-agendamento'
import { decidirVisita } from '@/lib/services/memorial-agendamento-gestao.service'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** Confirmar, recusar, cancelar, marcar em análise, realizada ou falta. */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'COMUNICACAO')) return forbidden(ctx)
    const { id } = await params
    const input = decidirVisitaSchema.parse(await req.json())
    const visita = await decidirVisita(id, input, caller.userId, getIp(req))
    logRequest(ctx, 'POST', `/api/v1/memorial/agendamentos/${id}/decisao`, 200)
    return ok(ctx, { id: visita.id, status: visita.status })
  } catch (err) {
    return handleError(ctx, err)
  }
}
