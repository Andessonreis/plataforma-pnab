import type { RequestContext } from '@server/adapters/next-route'
import { ipFromHeaders } from '@server/lib/auth/api-caller'
import { requireRole } from '@server/lib/auth/guards'
import { habilitacaoSchema } from '@shared/schemas/habilitacao.schema'
import { updateHabilitacao } from '../service/habilitacao.service'

export const habilitacaoController = {
  async update(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN', 'HABILITADOR')
    const input = habilitacaoSchema.parse(ctx.body)
    const result = await updateHabilitacao(ctx.params.id, input, user.id, user.role, ipFromHeaders(ctx.headers))
    return { data: result }
  },
}
