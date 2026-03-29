import { NextRequest } from 'next/server'
import { createContext, ok, created, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { cmsPageSchema } from '@/lib/schemas/cms'
import * as cmsService from '@/lib/services/cms.service'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  const ctx = createContext()
  try {
    const pages = await cmsService.listCmsPages()
    logRequest(ctx, 'GET', '/api/v1/cms', 200)
    return ok(ctx, pages, 'public, s-maxage=60, stale-while-revalidate=300')
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const data = cmsPageSchema.parse(await req.json())
    const result = await cmsService.createCmsPage(data, caller.userId, getIp(req))
    logRequest(ctx, 'POST', '/api/v1/cms', 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
