import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import * as exportService from '@/lib/services/export.service'

export const runtime = 'nodejs'

const importSchema = z.object({
  editalId: z.string().min(1),
  contemplados: z.array(z.object({
    inscricaoId: z.string().min(1),
    valorAprovado: z.number().min(0),
  })).min(1),
})

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const data = importSchema.parse(await req.json())
    const result = await exportService.importContemplados(data.editalId, data.contemplados, caller.userId, getIp(req))
    logRequest(ctx, 'POST', '/api/v1/contemplados/import', 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
