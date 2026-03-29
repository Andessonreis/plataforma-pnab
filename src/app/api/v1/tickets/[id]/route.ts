import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole } from '@/lib/api/auth-resolver'
import * as ticketService from '@/lib/services/ticket.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

const patchSchema = z.object({
  status: z.enum(['ABERTO', 'EM_ATENDIMENTO', 'FECHADO']).optional(),
  resposta: z.object({ texto: z.string().min(5) }).optional(),
})

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'ATENDIMENTO')) return forbidden(ctx)
    const { id } = await params
    const ticket = await ticketService.getTicketById(id)
    logRequest(ctx, 'GET', `/api/v1/tickets/${id}`, 200)
    return ok(ctx, ticket)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'ATENDIMENTO')) return forbidden(ctx)
    const { id } = await params
    const data = patchSchema.parse(await req.json())
    const result = await ticketService.updateTicket(id, data, caller.userId)
    logRequest(ctx, 'PUT', `/api/v1/tickets/${id}`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
