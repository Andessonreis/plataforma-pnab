import type { RequestContext } from '@server/adapters/next-route'
import { requireRole } from '@server/lib/auth/guards'
import { avaliacaoBodySchema } from '@shared/schemas/avaliacao.schema'
import { toAvaliacaoDetalhe, toAvaliacaoSalva } from './avaliacao.mapper'
import { getAvaliacao, saveAvaliacao } from './avaliacao.service'

export const avaliacaoController = {
  async detail(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN', 'AVALIADOR')
    const result = await getAvaliacao(ctx.params.id, user.id, user.role === 'ADMIN')
    return { data: toAvaliacaoDetalhe(result) }
  },

  async save(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN', 'AVALIADOR')
    const input = avaliacaoBodySchema.parse(ctx.body)
    const result = await saveAvaliacao(ctx.params.id, input, user.id, user.role === 'ADMIN')
    return { data: toAvaliacaoSalva(result) }
  },
}
