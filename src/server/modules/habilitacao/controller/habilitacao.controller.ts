import type { RequestContext } from '@server/adapters/next-route'
import { requireRole } from '@server/lib/auth/guards'
import { habilitacaoSchema } from '@shared/schemas/habilitacao.schema'
import { updateHabilitacao } from '../service/habilitacao.service'

function ipFromHeaders(headers: Headers): string | undefined {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() ?? headers.get('x-real-ip') ?? undefined
}

export const habilitacaoController = {
  async update(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN', 'HABILITADOR')
    const input = habilitacaoSchema.parse(ctx.body)
    const result = await updateHabilitacao(ctx.params.id, input, user.id, user.role, ipFromHeaders(ctx.headers))
    return { data: result }
  },
}
