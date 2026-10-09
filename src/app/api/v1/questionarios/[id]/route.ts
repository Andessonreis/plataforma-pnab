import { NextRequest } from 'next/server'
import { createContext, ok, noContent, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { alterarStatusSchema, questionarioSchema } from '@/lib/schemas/questionario'
import * as questionarioService from '@/lib/services/questionario.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { id } = await params
    const result = await questionarioService.obterQuestionario(id)
    logRequest(ctx, 'GET', `/api/v1/questionarios/${id}`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { id } = await params
    const data = questionarioSchema.parse(await req.json())
    const result = await questionarioService.atualizarQuestionario(id, data, caller.userId, getIp(req))
    logRequest(ctx, 'PUT', `/api/v1/questionarios/${id}`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}

/** Troca só o status (publicar, arquivar, voltar a rascunho). */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { id } = await params
    const { status } = alterarStatusSchema.parse(await req.json())
    const result = await questionarioService.alterarStatusQuestionario(id, status, caller.userId, getIp(req))
    logRequest(ctx, 'PATCH', `/api/v1/questionarios/${id}`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { id } = await params
    await questionarioService.excluirQuestionario(id, caller.userId, getIp(req))
    logRequest(ctx, 'DELETE', `/api/v1/questionarios/${id}`, 204)
    return noContent(ctx)
  } catch (err) {
    return handleError(ctx, err)
  }
}
