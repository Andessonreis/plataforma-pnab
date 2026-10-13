import { NextRequest } from 'next/server'
import { createContext, forbidden, handleError, logRequest, ok } from '@/lib/api/response'
import { requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { obterVisita } from '@/lib/services/memorial-agendamento-gestao.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { id } = await params
    const visita = await obterVisita(id)
    logRequest(ctx, 'GET', `/api/v1/memorial/agendamentos/${id}`, 200)
    return ok(ctx, visita)
  } catch (err) {
    return handleError(ctx, err)
  }
}
