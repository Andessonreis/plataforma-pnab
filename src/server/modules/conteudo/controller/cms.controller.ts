import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { cmsPageSchema } from '@shared/schemas/cms.schema'
import {
  listCmsPages,
  getCmsPageBySlug,
  createCmsPage,
  updateCmsPage,
  deleteCmsPage,
} from '../service/cms.service'
import { toCmsPageDTO } from '../mapper/cms.mapper'

const PUBLIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

export const cmsController = {
  async list() {
    const pages = await listCmsPages()
    return { data: pages.map(toCmsPageDTO), cacheControl: PUBLIC_CACHE }
  },

  async detail(ctx: RequestContext) {
    const page = await getCmsPageBySlug(ctx.params.id)
    return { data: toCmsPageDTO(page), cacheControl: PUBLIC_CACHE }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = cmsPageSchema.parse(ctx.body)
    const page = await createCmsPage(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toCmsPageDTO(page), status: 201 }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = cmsPageSchema.parse(ctx.body)
    const page = await updateCmsPage(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toCmsPageDTO(page) }
  },

  async remove(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    await deleteCmsPage(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Página excluída.' } }
  },
}
