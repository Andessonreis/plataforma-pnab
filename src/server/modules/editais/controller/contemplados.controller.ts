import type { RequestContext } from '@server/adapters/next-route'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { BadRequestError, ForbiddenError } from '@server/lib/http/errors'
import { importContempladosFormSchema } from '@shared/schemas/contemplados.schema'
import { importContemplados } from '../service/contemplados.service'

export const contempladosController = {
  async import(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()

    if (!(ctx.body instanceof FormData)) throw new BadRequestError('Use multipart/form-data')

    const { editalId } = importContempladosFormSchema.parse({
      editalId: ctx.body.get('editalId'),
    })

    const file = ctx.body.get('file')
    if (!(file instanceof File) || file.size === 0) {
      throw new BadRequestError('Arquivo CSV é obrigatório.')
    }
    if (!file.name.endsWith('.csv')) {
      throw new BadRequestError('O arquivo deve ser um CSV (.csv).')
    }

    const csvText = await file.text()

    const result = await importContemplados(editalId, csvText, caller.userId, ipFromHeaders(ctx.headers))
    return { data: result }
  },
}
