import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { importContempladosSchema } from '@shared/schemas/contemplados.schema'
import { importContemplados } from '../service/contemplados.service'

export const contempladosController = {
  async import(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = importContempladosSchema.parse(ctx.body)
    const result = await importContemplados(
      data.editalId,
      data.contemplados,
      caller.userId,
      ipFromHeaders(ctx.headers),
    )
    return { data: result }
  },
}
