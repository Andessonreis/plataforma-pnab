import type { RequestContext } from '@server/adapters/next-route'
import { requireAdmin } from '@server/lib/auth/guards'
import { BadRequestError } from '@server/lib/http/errors'
import { arquivoEditalUploadMetaSchema } from '@shared/schemas/arquivos-edital.schema'
import { arquivosEditalService } from './arquivos-edital.service'
import { toArquivoEditalDTO } from './arquivos-edital.mapper'

export const arquivosEditalController = {
  async list(ctx: RequestContext) {
    await requireAdmin(ctx.headers)
    const editalId = ctx.params.id
    const items = await arquivosEditalService.list(editalId)
    return { data: items.map(toArquivoEditalDTO) }
  },

  async upload(ctx: RequestContext) {
    await requireAdmin(ctx.headers)
    const editalId = ctx.params.id

    if (!(ctx.body instanceof FormData)) {
      throw new BadRequestError('Use multipart/form-data')
    }

    const file = ctx.body.get('file')
    if (!(file instanceof File)) {
      throw new BadRequestError('Campo "file" obrigatório')
    }

    const meta = arquivoEditalUploadMetaSchema.parse({
      tipo: ctx.body.get('tipo'),
      titulo: ctx.body.get('titulo'),
      acessivel: ctx.body.get('acessivel') ?? false,
    })

    const arquivo = await arquivosEditalService.upload(editalId, file, meta)
    return { data: toArquivoEditalDTO(arquivo), status: 201 }
  },

  async remove(ctx: RequestContext) {
    await requireAdmin(ctx.headers)
    const arquivoId = ctx.params.arquivoId
    await arquivosEditalService.remove(arquivoId)
    return { data: { ok: true } }
  },
}
