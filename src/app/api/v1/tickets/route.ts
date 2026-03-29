import { NextRequest } from 'next/server'
import { createContext, okPaginated, created, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole } from '@/lib/api/auth-resolver'
import { createTicketSchema, ticketQuerySchema } from '@/lib/schemas/ticket'
import * as ticketService from '@/lib/services/ticket.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'ATENDIMENTO')) return forbidden(ctx)
    const params = ticketQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const result = await ticketService.listTickets(params.page, params.pageSize, params.status)
    logRequest(ctx, 'GET', '/api/v1/tickets', 200)
    return okPaginated(ctx, result.data, result.meta)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const data = createTicketSchema.parse(await req.json())
    const caller = await resolveAuth(req)
    const ticket = await ticketService.createTicket({
      ...data,
      autorId: caller?.userId,
    })
    logRequest(ctx, 'POST', '/api/v1/tickets', 201)
    return created(ctx, ticket)
  } catch (err) {
    return handleError(ctx, err)
  }
}
