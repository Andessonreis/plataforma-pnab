import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole } from '@/lib/api/auth-resolver'
import * as auditService from '@/lib/services/audit.service'

export const runtime = 'nodejs'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  action: z.string().optional(),
  userId: z.string().optional(),
  entity: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const result = await auditService.queryLogs(params)
    logRequest(ctx, 'GET', '/api/v1/logs', 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
