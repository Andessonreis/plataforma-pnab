import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { faqSchema } from '@shared/schemas/faq.schema'
import {
  listFaq,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../service/faq.service'
import { toFaqItemDTO } from '../mapper/faq.mapper'

const PUBLIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

export const faqController = {
  async list(ctx: RequestContext) {
    const editalId = ctx.query.editalId ?? undefined
    const items = await listFaq(editalId)
    return { data: items.map(toFaqItemDTO), cacheControl: PUBLIC_CACHE }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN', 'ATENDIMENTO')) throw new ForbiddenError()
    const data = faqSchema.parse(ctx.body)
    const item = await createFaq(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toFaqItemDTO(item), status: 201 }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN', 'ATENDIMENTO')) throw new ForbiddenError()
    const data = faqSchema.parse(ctx.body)
    const item = await updateFaq(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toFaqItemDTO(item) }
  },

  async remove(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    await deleteFaq(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'FAQ excluído.' } }
  },
}
