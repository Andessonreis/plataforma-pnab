import { NextRequest } from 'next/server'
import { createContext, created, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import * as questionarioService from '@/lib/services/questionario.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { id } = await params
    const result = await questionarioService.duplicarQuestionario(id, caller.userId, getIp(req))
    logRequest(ctx, 'POST', `/api/v1/questionarios/${id}/duplicar`, 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
