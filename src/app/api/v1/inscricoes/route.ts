import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, okPaginated, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole } from '@/lib/api/auth-resolver'
import * as inscricaoService from '@/lib/services/inscricao.service'

export const runtime = 'nodejs'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  editalId: z.string().optional(),
  status: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'HABILITADOR', 'ATENDIMENTO')) return forbidden(ctx)
    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const result = await inscricaoService.listInscricoesAdmin(params.page, params.pageSize, params.editalId, params.status)
    logRequest(ctx, 'GET', '/api/v1/inscricoes', 200)
    return okPaginated(ctx, result.data, result.meta)
  } catch (err) {
    return handleError(ctx, err)
  }
}
