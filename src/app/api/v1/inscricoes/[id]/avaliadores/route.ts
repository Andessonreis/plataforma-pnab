import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, created, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole } from '@/lib/api/auth-resolver'
import * as avaliacaoService from '@/lib/services/avaliacao.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

const assignSchema = z.object({
  avaliadorIds: z.array(z.string().min(1)).min(1, 'Informe ao menos um avaliador'),
})

const removeSchema = z.object({
  avaliadorId: z.string().min(1, 'ID do avaliador é obrigatório'),
})

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const { id } = await params
    const { avaliadorIds } = assignSchema.parse(await req.json())
    const result = await avaliacaoService.assignAvaliadores(id, avaliadorIds, caller.userId)
    logRequest(ctx, 'POST', `/api/v1/inscricoes/${id}/avaliadores`, 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const { id } = await params
    const { avaliadorId } = removeSchema.parse(await req.json())
    await avaliacaoService.removeAvaliador(id, avaliadorId, caller.userId)
    logRequest(ctx, 'DELETE', `/api/v1/inscricoes/${id}/avaliadores`, 200)
    return ok(ctx, { message: 'Avaliador removido.' })
  } catch (err) {
    return handleError(ctx, err)
  }
}
