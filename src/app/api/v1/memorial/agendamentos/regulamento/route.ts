import { NextRequest } from 'next/server'
import { createContext, created, forbidden, handleError, logRequest, notFound, ok } from '@/lib/api/response'
import { getIp, requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { regulamentoSchema } from '@/lib/schemas/memorial-agendamento'
import { obterRegulamentoVigente, publicarNovoRegulamento } from '@/lib/services/memorial-regulamento.service'

export const runtime = 'nodejs'

const PATH = '/api/v1/memorial/agendamentos/regulamento'

export async function GET() {
  const ctx = createContext()
  try {
    const regulamento = await obterRegulamentoVigente()
    if (!regulamento) return notFound(ctx, 'O regulamento de visitação ainda não foi publicado.')
    logRequest(ctx, 'GET', PATH, 200)
    return ok(ctx, regulamento, 'public, s-maxage=60, stale-while-revalidate=300')
  } catch (err) {
    return handleError(ctx, err)
  }
}

/** Publica uma versão nova; as anteriores ficam guardadas para os aceites já feitos. */
export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'COMUNICACAO')) return forbidden(ctx)
    const { texto } = regulamentoSchema.parse(await req.json())
    const result = await publicarNovoRegulamento(texto, caller.userId, getIp(req))
    logRequest(ctx, 'POST', PATH, 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
