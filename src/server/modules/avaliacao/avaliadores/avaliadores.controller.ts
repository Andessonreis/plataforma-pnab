import type { RequestContext } from '@server/adapters/next-route'
import { requireRole } from '@server/lib/auth/guards'
import { atribuirAvaliadoresSchema } from '@shared/schemas/avaliacao.schema'
import { assignAvaliadores, listAvaliadores, removeAvaliador } from './avaliadores.service'

export const avaliadoresController = {
  async list(ctx: RequestContext) {
    await requireRole(ctx.headers, 'ADMIN')
    const avaliadores = await listAvaliadores()
    return { data: avaliadores }
  },

  async assign(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN')
    const input = atribuirAvaliadoresSchema.parse(ctx.body)
    const result = await assignAvaliadores(ctx.params.id, input.avaliadorIds, user.id, {
      adminOverride: input.adminOverride,
      adminOverrideJustificativa: input.adminOverrideJustificativa,
    })
    return { data: result, status: 201 }
  },

  async remove(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN')
    const result = await removeAvaliador(ctx.params.id, ctx.params.avaliadorId, user.id)
    return { data: result }
  },
}
