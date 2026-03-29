import { NextRequest } from 'next/server'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { editalSchema } from '@/lib/schemas/edital'
import * as editalService from '@/lib/services/edital.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const { id } = await params
    const edital = await editalService.getEditalById(id)
    logRequest(ctx, 'GET', `/api/v1/editais/${id}`, 200)
    return ok(ctx, edital, 'public, s-maxage=60, stale-while-revalidate=300')
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const { id } = await params
    const data = editalSchema.parse(await req.json())
    const result = await editalService.updateEdital(id, data, caller.userId, getIp(req))
    logRequest(ctx, 'PUT', `/api/v1/editais/${id}`, 200)
    return ok(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
