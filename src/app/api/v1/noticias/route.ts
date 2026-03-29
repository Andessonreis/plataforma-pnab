import { NextRequest } from 'next/server'
import { createContext, okPaginated, created, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { paginationSchema } from '@/lib/schemas/pagination'
import { noticiaSchema } from '@/lib/schemas/noticia'
import * as noticiaService from '@/lib/services/noticia.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const params = paginationSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const result = await noticiaService.listNoticias(params.page, params.pageSize)
    logRequest(ctx, 'GET', '/api/v1/noticias', 200)
    return okPaginated(ctx, result.data, result.meta, 'public, s-maxage=60, stale-while-revalidate=300')
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const data = noticiaSchema.parse(await req.json())
    const result = await noticiaService.createNoticia(data, caller.userId, getIp(req))
    logRequest(ctx, 'POST', '/api/v1/noticias', 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
