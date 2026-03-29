import { NextRequest } from 'next/server'
import { createContext, okPaginated, created, handleError, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { editalSchema, editalQuerySchema } from '@/lib/schemas/edital'
import * as editalService from '@/lib/services/edital.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const params = editalQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const result = await editalService.listEditais(params.page, params.pageSize, params.status)
    logRequest(ctx, 'GET', '/api/v1/editais', 200)
    return okPaginated(ctx, result.data, result.meta, 'public, s-maxage=60, stale-while-revalidate=300')
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) {
      const { forbidden } = await import('@/lib/api/response')
      return forbidden(ctx)
    }
    const data = editalSchema.parse(await req.json())
    const result = await editalService.createEdital(data, caller.userId, getIp(req))
    logRequest(ctx, 'POST', '/api/v1/editais', 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
