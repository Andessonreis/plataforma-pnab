import { NextRequest } from 'next/server'
import { createContext, handleError, logRequest, ok } from '@/lib/api/response'
import { disponibilidadeQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { consultarDisponibilidade } from '@/lib/services/memorial-agendamento.service'

export const runtime = 'nodejs'

/** Dias e horários livres. Público e sem dado de quem já reservou. */
export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const q = disponibilidadeQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const result = await consultarDisponibilidade(q)
    logRequest(ctx, 'GET', '/api/v1/memorial/agendamentos/disponibilidade', 200)
    // Cache curto: a vaga muda a cada pedido, e o POST confere tudo de novo de qualquer forma.
    return ok(ctx, result, 'public, s-maxage=15, stale-while-revalidate=30')
  } catch (err) {
    return handleError(ctx, err)
  }
}
