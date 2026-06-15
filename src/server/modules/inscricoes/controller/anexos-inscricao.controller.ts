import type { RequestContext } from '@server/adapters/next-route'
import { requireProponente, requireRole } from '@server/lib/auth/guards'
import { BadRequestError } from '@server/lib/http/errors'
import { anexoUploadMetaSchema } from '@shared/schemas/anexos-inscricao.schema'
import { toAnexoInscricao } from '../mapper/anexos-inscricao.mapper'
import { getAnexoSignedUrl, removeAnexo, uploadAnexo } from '../service/anexos-inscricao.service'

function ipFromHeaders(headers: Headers): string | undefined {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() ?? headers.get('x-real-ip') ?? undefined
}

export const anexosInscricaoController = {
  async upload(ctx: RequestContext) {
    const user = await requireProponente(ctx.headers)
    if (!(ctx.body instanceof FormData)) throw new BadRequestError('Use multipart/form-data')

    const file = ctx.body.get('file')
    if (!(file instanceof File)) throw new BadRequestError('Campo "file" obrigatório')

    const meta = anexoUploadMetaSchema.parse({
      tipo: ctx.body.get('tipo'),
      titulo: ctx.body.get('titulo'),
    })

    const anexo = await uploadAnexo(ctx.params.id, file, meta, user.id, ipFromHeaders(ctx.headers))
    return { data: toAnexoInscricao(anexo), status: 201 }
  },

  async remove(ctx: RequestContext) {
    const user = await requireProponente(ctx.headers)
    const result = await removeAnexo(ctx.params.id, ctx.params.anexoId, user.id)
    return { data: result }
  },

  async signedUrl(ctx: RequestContext) {
    await requireRole(ctx.headers, 'ADMIN', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR')
    const result = await getAnexoSignedUrl(ctx.params.id, ctx.params.anexoId)
    return { data: result }
  },
}
