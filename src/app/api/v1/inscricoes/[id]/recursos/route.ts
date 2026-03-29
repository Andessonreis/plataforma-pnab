import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, ok, created, handleError, unauthorized, logRequest } from '@/lib/api/response'
import { resolveAuth, requireAnyAuth, getIp } from '@/lib/api/auth-resolver'
import * as recursoService from '@/lib/services/recurso.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

const recursoSchema = z.object({
  fase: z.enum(['HABILITACAO', 'RESULTADO_PRELIMINAR', 'RESULTADO_FINAL']),
  texto: z.string().min(20).max(5000),
  urlAnexos: z.array(z.string().url()).max(5).default([]),
})

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const { id } = await params
    const recursos = await recursoService.listRecursos(id, caller.userId, caller.role)
    logRequest(ctx, 'GET', `/api/v1/inscricoes/${id}/recursos`, 200)
    return ok(ctx, recursos)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const { id } = await params
    const data = recursoSchema.parse(await req.json())
    const recurso = await recursoService.submitRecurso(id, data, caller.userId, getIp(req))
    logRequest(ctx, 'POST', `/api/v1/inscricoes/${id}/recursos`, 201)
    return created(ctx, recurso)
  } catch (err) {
    return handleError(ctx, err)
  }
}
