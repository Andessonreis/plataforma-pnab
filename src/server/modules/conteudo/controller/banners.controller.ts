import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { bannerSchema } from '@shared/schemas/banners.schema'
import {
  listBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../service/banners.service'
import { toBannerDTO } from '../mapper/banners.mapper'

// Banners aparecem no layout público → revalida o layout inteiro após mutação.
const REVALIDATE = [{ path: '/', type: 'layout' as const }]

export const bannersController = {
  async list(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const banners = await listBanners()
    return { data: banners.map(toBannerDTO) }
  },

  async detail(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const banner = await getBannerById(ctx.params.id)
    return { data: toBannerDTO(banner) }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = bannerSchema.parse(ctx.body)
    const banner = await createBanner(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toBannerDTO(banner), status: 201, revalidate: REVALIDATE }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = bannerSchema.parse(ctx.body)
    const banner = await updateBanner(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toBannerDTO(banner), revalidate: REVALIDATE }
  },

  async remove(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    await deleteBanner(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Banner excluído.' }, revalidate: REVALIDATE }
  },
}
