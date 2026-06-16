import type { RequestContext } from '@server/adapters/next-route'
import { BadRequestError, ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole } from '@server/lib/auth/api-caller'
import { uploadImagem } from '../service/upload.service'

export const uploadController = {
  async imagem(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError('Acesso negado.')

    if (!(ctx.body instanceof FormData)) {
      throw new BadRequestError('Use multipart/form-data')
    }

    const file = ctx.body.get('file')
    if (!(file instanceof File)) {
      throw new BadRequestError('Campo "file" é obrigatório.')
    }

    const pasta = (ctx.body.get('pasta') as string | null) ?? 'noticias'
    const result = await uploadImagem(file, pasta)
    return { data: result, status: 201 }
  },
}
