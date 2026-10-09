import { NextRequest } from 'next/server'
import { createContext, created, forbidden, handleError, logRequest, okPaginated } from '@/lib/api/response'
import { getIp, requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import { listarVisitasQuerySchema, solicitarVisitaSchema } from '@/lib/schemas/memorial-agendamento'
import { solicitarVisita } from '@/lib/services/memorial-agendamento.service'
import { listarVisitas } from '@/lib/services/memorial-agendamento-gestao.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const runtime = 'nodejs'

const PATH = '/api/v1/memorial/agendamentos'

/** Lista da equipe, com dados de contato — só Comunicação. */
export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const q = listarVisitasQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const { itens, total } = await listarVisitas(q)
    logRequest(ctx, 'GET', PATH, 200)
    return okPaginated(ctx, itens, { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) })
  } catch (err) {
    return handleError(ctx, err)
  }
}

/** Pedido público de visita. Conta logada é opcional: se houver, o pedido fica ligado a ela. */
export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const limited = await rateLimit(req, 'memorial/agendamento', RATE_LIMITS['memorial/agendamento'])
    if (limited) return limited

    const input = solicitarVisitaSchema.parse(await req.json())
    const caller = await resolveAuth(req)
    const result = await solicitarVisita(input, { userId: caller?.userId, ip: getIp(req) })
    logRequest(ctx, 'POST', PATH, 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
