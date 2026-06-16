import type { RequestContext } from '@server/adapters/next-route'
import { BadRequestError, ForbiddenError, UnauthorizedError } from '@server/lib/http/errors'
import { resolveApiCaller, callerIsAuthenticated } from '@server/lib/auth/api-caller'
import { uploadDeclaracao } from '../service/declaracao.service'

export const declaracaoController = {
  async upload(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError('Autenticação necessária.')

    if (!(ctx.body instanceof FormData)) {
      throw new BadRequestError('Use multipart/form-data')
    }

    const file = ctx.body.get('file')
    const userId = ctx.body.get('userId')

    if (!(file instanceof File) || typeof userId !== 'string' || !userId) {
      throw new BadRequestError('Arquivo e userId são obrigatórios.')
    }

    if (userId !== caller.userId) throw new ForbiddenError('Acesso negado.')

    const result = await uploadDeclaracao(file, userId)
    return { data: { ...result, message: 'Declaração enviada com sucesso.' }, status: 201 }
  },
}
