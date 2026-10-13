import { NextRequest } from 'next/server'
import { createContext, handleError, logRequest, okPaginated, unauthorized } from '@/lib/api/response'
import { resolveAuth } from '@/lib/api/auth-resolver'
import { paginationSchema } from '@/lib/schemas/pagination'
import { listarMinhasVisitas } from '@/lib/services/memorial-agendamento.service'

export const runtime = 'nodejs'

/** Visitas pedidas pela conta logada. Cada pessoa só enxerga as próprias. */
export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!caller) return unauthorized(ctx)
    const { page, pageSize } = paginationSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const { itens, total } = await listarMinhasVisitas(caller.userId, page, pageSize)
    logRequest(ctx, 'GET', '/api/v1/memorial/agendamentos/minhas', 200)
    return okPaginated(ctx, itens, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    return handleError(ctx, err)
  }
}
