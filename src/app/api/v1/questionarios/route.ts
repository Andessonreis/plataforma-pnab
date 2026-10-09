import { NextRequest } from 'next/server'
import { createContext, created, okPaginated, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { listarQuestionariosSchema, questionarioSchema } from '@/lib/schemas/questionario'
import * as questionarioService from '@/lib/services/questionario.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'COMUNICACAO')) return forbidden(ctx)
    const filtros = listarQuestionariosSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const result = await questionarioService.listarQuestionarios(filtros)
    logRequest(ctx, 'GET', '/api/v1/questionarios', 200)
    return okPaginated(ctx, result.data, result.meta)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'COMUNICACAO')) return forbidden(ctx)
    const data = questionarioSchema.parse(await req.json())
    const result = await questionarioService.criarQuestionario(data, caller.userId, getIp(req))
    logRequest(ctx, 'POST', '/api/v1/questionarios', 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
