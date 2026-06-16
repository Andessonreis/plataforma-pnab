import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { slideSchema } from '@shared/schemas/slides.schema'
import {
  listSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
} from '../service/slides.service'
import { toSlideDTO } from '../mapper/slides.mapper'

export const slidesController = {
  async list(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const slides = await listSlides()
    return { data: slides.map(toSlideDTO) }
  },

  async detail(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const slide = await getSlideById(ctx.params.id)
    return { data: toSlideDTO(slide) }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = slideSchema.parse(ctx.body)
    const slide = await createSlide(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toSlideDTO(slide), status: 201 }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = slideSchema.parse(ctx.body)
    const slide = await updateSlide(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toSlideDTO(slide) }
  },

  async remove(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    await deleteSlide(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Slide excluído.' } }
  },
}
