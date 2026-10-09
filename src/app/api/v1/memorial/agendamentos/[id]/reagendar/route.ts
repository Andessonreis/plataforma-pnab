import { NextRequest } from 'next/server'
import { createContext, forbidden, handleError, logRequest, ok } from '@/lib/api/response'
import { getIp, requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { reagendarVisitaSchema } from '@/lib/schemas/memorial-agendamento'
import { reagendarVisita } from '@/lib/services/memorial-agendamento-gestao.service'
import { dateParaDia } from '@/lib/memorial/agendamento/datas'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'COMUNICACAO')) return forbidden(ctx)
    const { id } = await params
    const input = reagendarVisitaSchema.parse(await req.json())
    const v = await reagendarVisita(id, input, caller.userId, getIp(req))
    logRequest(ctx, 'POST', `/api/v1/memorial/agendamentos/${id}/reagendar`, 200)
    return ok(ctx, { id: v.id, data: dateParaDia(v.data), turno: v.turno, horaInicio: v.horaInicio, horaFim: v.horaFim })
  } catch (err) {
    return handleError(ctx, err)
  }
}
