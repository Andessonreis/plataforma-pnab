import { NextRequest, NextResponse } from 'next/server'
import { createContext, forbidden, handleError, logRequest } from '@/lib/api/response'
import { getIp, requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { listarVisitasQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { exportarVisitasCsv } from '@/lib/services/memorial-agendamento-relatorio.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const runtime = 'nodejs'

/** CSV com os mesmos filtros da lista (sem paginação, com teto no serviço). */
export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const q = listarVisitasQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const csv = await exportarVisitasCsv(q, caller.userId, getIp(req))

    const sufixo = [q.de, q.ate].filter(Boolean).join('_') || new Date().toISOString().slice(0, 10)
    logRequest(ctx, 'GET', '/api/v1/memorial/agendamentos/exportar', 200)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="visitas_memorial_${sufixo}.csv"`,
        'X-Request-Id': ctx.requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return handleError(ctx, err)
  }
}
