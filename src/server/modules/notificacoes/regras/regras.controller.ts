import { z } from 'zod'
import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { ruleSchema } from '@shared/schemas/notifications.schema'
import {
  createRegra,
  deleteRegra,
  getRegra,
  listRegras,
  previewRegraAudience,
  toggleRegra,
  updateRegra,
} from './regras.service'

const listQuerySchema = z.object({
  ativo: z.enum(['true', 'false']).optional(),
})

const toggleSchema = z.object({ ativo: z.boolean() })

async function requireAdmin(ctx: RequestContext) {
  const caller = await resolveApiCaller(ctx.headers)
  if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
  return caller
}

export const regrasController = {
  async list(ctx: RequestContext) {
    await requireAdmin(ctx)
    const { ativo } = listQuerySchema.parse(ctx.query)
    const rules = await listRegras(ativo)
    return { data: rules }
  },

  async detail(ctx: RequestContext) {
    await requireAdmin(ctx)
    const rule = await getRegra(ctx.params.id)
    return { data: rule }
  },

  async create(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    const data = ruleSchema.parse(ctx.body)
    const rule = await createRegra(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Regra criada (desativada).', id: rule.id }, status: 201 }
  },

  async update(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    const data = ruleSchema.parse(ctx.body)
    const rule = await updateRegra(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Regra atualizada.', id: rule.id } }
  },

  async remove(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    await deleteRegra(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Regra excluída.' } }
  },

  async toggle(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    const { ativo } = toggleSchema.parse(ctx.body)
    const rule = await toggleRegra(ctx.params.id, ativo, caller.userId, ipFromHeaders(ctx.headers))
    return {
      data: {
        message: rule.ativo ? 'Regra ativada.' : 'Regra desativada.',
        id: rule.id,
        ativo: rule.ativo,
      },
    }
  },

  async previewAudience(ctx: RequestContext) {
    await requireAdmin(ctx)
    const total = await previewRegraAudience(ctx.params.id)
    return { data: { total } }
  },
}
