import { NextRequest } from 'next/server'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { faqSchema } from '@/lib/schemas/faq'
import * as faqService from '@/lib/services/faq.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'ATENDIMENTO')) return forbidden(ctx)
    const { id } = await params
    const data = faqSchema.parse(await req.json())
    const result = await faqService.updateFaq(id, data, caller.userId, getIp(req))
    logRequest(ctx, 'PUT', `/api/v1/faq/${id}`, 200)
    return ok(ctx, result)
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
    await faqService.deleteFaq(id, caller.userId, getIp(req))
    logRequest(ctx, 'DELETE', `/api/v1/faq/${id}`, 200)
    return ok(ctx, { message: 'FAQ excluído.' })
  } catch (err) {
    return handleError(ctx, err)
  }
}
