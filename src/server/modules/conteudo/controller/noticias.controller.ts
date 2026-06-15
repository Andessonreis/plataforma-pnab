import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { paginationSchema } from '@shared/schemas/pagination.schema'
import { noticiaSchema } from '@shared/schemas/noticias.schema'
import {
  listNoticias,
  getNoticiaBySlug,
  createNoticia,
  updateNoticia,
  deleteNoticia,
} from '../service/noticias.service'

const PUBLIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

export const noticiasController = {
  async list(ctx: RequestContext) {
    const { page, pageSize } = paginationSchema.parse(ctx.query)
    const result = await listNoticias(page, pageSize)
    return { data: result.data, meta: result.meta, cacheControl: PUBLIC_CACHE }
  },

  async detail(ctx: RequestContext) {
    const noticia = await getNoticiaBySlug(ctx.params.id)
    return { data: noticia, cacheControl: PUBLIC_CACHE }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = noticiaSchema.parse(ctx.body)
    const noticia = await createNoticia(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: noticia, status: 201 }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = noticiaSchema.parse(ctx.body)
    const noticia = await updateNoticia(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: noticia }
  },

  async remove(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    await deleteNoticia(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Notícia excluída.' } }
  },
}
