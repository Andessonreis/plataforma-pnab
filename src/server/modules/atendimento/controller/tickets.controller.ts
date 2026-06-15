import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import {
  createAtendimentoSchema,
  atendimentoQuerySchema,
  atendimentoPatchSchema,
} from '@shared/schemas/tickets.schema'
import {
  createAtendimento,
  listAtendimentos,
  getAtendimentoById,
  updateAtendimento,
} from '../service/tickets.service'

export const ticketsController = {
  async list(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN', 'ATENDIMENTO')) throw new ForbiddenError()
    const params = atendimentoQuerySchema.parse(ctx.query)
    const result = await listAtendimentos(params.page, params.pageSize, params.status)
    return { data: result.data, meta: result.meta }
  },

  async create(ctx: RequestContext) {
    const data = createAtendimentoSchema.parse(ctx.body)
    const caller = await resolveApiCaller(ctx.headers)
    const atendimento = await createAtendimento(
      { ...data, autorId: caller?.userId },
      ipFromHeaders(ctx.headers),
    )
    return { data: atendimento, status: 201 }
  },

  async detail(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN', 'ATENDIMENTO')) throw new ForbiddenError()
    const atendimento = await getAtendimentoById(ctx.params.id)
    return { data: atendimento }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN', 'ATENDIMENTO')) throw new ForbiddenError()
    const data = atendimentoPatchSchema.parse(ctx.body)
    const result = await updateAtendimento(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: result }
  },
}
