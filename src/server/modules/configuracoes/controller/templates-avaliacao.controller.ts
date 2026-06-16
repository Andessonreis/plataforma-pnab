import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import {
  templateAvaliacaoCreateSchema,
  templateAvaliacaoUpdateSchema,
} from '@shared/schemas/configuracoes-templates-avaliacao.schema'
import {
  createTemplateAvaliacao,
  deleteTemplateAvaliacao,
  getTemplateAvaliacao,
  listTemplatesAvaliacao,
  updateTemplateAvaliacao,
} from '../service/templates-avaliacao.service'
import { toTemplateAvaliacaoDTO } from '../mapper/templates-avaliacao.mapper'

export const templatesAvaliacaoController = {
  async list(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const includeInactive = ctx.query.all === 'true'
    const templates = await listTemplatesAvaliacao(includeInactive)
    return { data: templates.map(toTemplateAvaliacaoDTO) }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = templateAvaliacaoCreateSchema.parse(ctx.body)
    const template = await createTemplateAvaliacao(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toTemplateAvaliacaoDTO(template), status: 201 }
  },

  async detail(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const template = await getTemplateAvaliacao(ctx.params.id)
    return { data: toTemplateAvaliacaoDTO(template) }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = templateAvaliacaoUpdateSchema.parse(ctx.body)
    const template = await updateTemplateAvaliacao(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toTemplateAvaliacaoDTO(template) }
  },

  async remove(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    await deleteTemplateAvaliacao(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Template excluído.' } }
  },
}
