import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import * as resultadoService from '@/lib/services/resultado.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

const publishSchema = z.object({
  fase: z.enum(['RESULTADO_PRELIMINAR', 'RESULTADO_FINAL']),
})

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const { id } = await params
    const result = await resultadoService.getResultados(id)
    logRequest(ctx, 'GET', `/api/v1/editais/${id}/resultados`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const { id } = await params
    const { fase } = publishSchema.parse(await req.json())
    const result = await resultadoService.publishResultados(id, fase, caller.userId, getIp(req))
    logRequest(ctx, 'POST', `/api/v1/editais/${id}/resultados`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
