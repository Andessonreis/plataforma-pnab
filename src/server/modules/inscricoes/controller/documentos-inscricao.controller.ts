import type { RequestContext } from '@server/adapters/next-route'
import { requireAuth } from '@server/lib/auth/guards'
import { gerarComprovante, gerarProjetoPdf } from '../service/documentos-inscricao.service'

export const documentosInscricaoController = {
  async comprovante(ctx: RequestContext) {
    const user = await requireAuth(ctx.headers)
    const { buffer, filename } = await gerarComprovante(ctx.params.id, user.id, user.role)
    return { file: { body: buffer, contentType: 'application/pdf', filename } }
  },

  async projeto(ctx: RequestContext) {
    const user = await requireAuth(ctx.headers)
    const { buffer, filename } = await gerarProjetoPdf(ctx.params.id, user.id, user.role)
    return { file: { body: buffer, contentType: 'application/pdf', filename } }
  },
}
