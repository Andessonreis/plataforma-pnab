import { NextRequest } from 'next/server'
import { createContext, ok, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { cmsPageSchema } from '@/lib/schemas/cms'
import * as cmsService from '@/lib/services/cms.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const { id } = await params
    const page = await cmsService.getCmsPageBySlug(id)
    logRequest(ctx, 'GET', `/api/v1/cms/${id}`, 200)
    return ok(ctx, page, 'public, s-maxage=60, stale-while-revalidate=300')
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
    const data = cmsPageSchema.parse(await req.json())
    const result = await cmsService.updateCmsPage(id, data, caller.userId, getIp(req))
    logRequest(ctx, 'PUT', `/api/v1/cms/${id}`, 200)
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
    await cmsService.deleteCmsPage(id, caller.userId, getIp(req))
    logRequest(ctx, 'DELETE', `/api/v1/cms/${id}`, 200)
    return ok(ctx, { message: 'Página excluída.' })
  } catch (err) {
    return handleError(ctx, err)
  }
}
