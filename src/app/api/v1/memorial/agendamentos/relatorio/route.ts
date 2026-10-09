import { NextRequest } from 'next/server'
import { createContext, forbidden, handleError, logRequest, ok } from '@/lib/api/response'
import { requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { relatorioQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { relatorioVisitas } from '@/lib/services/memorial-agendamento-relatorio.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const runtime = 'nodejs'

/** Números agregados do período — sem nenhum dado pessoal. */
export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { de, ate } = relatorioQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const result = await relatorioVisitas(de, ate)
    logRequest(ctx, 'GET', '/api/v1/memorial/agendamentos/relatorio', 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
