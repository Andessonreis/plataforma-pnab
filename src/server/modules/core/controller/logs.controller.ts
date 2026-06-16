import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole } from '@server/lib/auth/api-caller'
import { logsQuerySchema } from '@shared/schemas/logs.schema'
import { purgeAuditLogs, purgeErrorLogs, queryLogs } from '../service/logs.service'

export const logsController = {
  async list(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const params = logsQuerySchema.parse(ctx.query)
    const result = await queryLogs(params)
    return { data: result }
  },

  async purge(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const force = ctx.query.force === 'true'
    const result = await purgeAuditLogs(force)
    return { data: result }
  },

  async purgeErros(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const force = ctx.query.force === 'true'
    const result = await purgeErrorLogs(force)
    return { data: result }
  },
}
