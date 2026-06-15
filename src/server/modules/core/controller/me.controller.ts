import type { RequestContext } from '@server/adapters/next-route'
import { UnauthorizedError } from '@server/lib/http/errors'
import { resolveApiCaller, callerIsAuthenticated, ipFromHeaders } from '@server/lib/auth/api-caller'
import { updateProfileSchema } from '@shared/schemas/user.schema'
import { getProfile, updateProfile } from '../service/me.service'

export const meController = {
  async get(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError()
    const user = await getProfile(caller.userId)
    return { data: user }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError()
    const data = updateProfileSchema.parse(ctx.body)
    await updateProfile(caller.userId, data, ipFromHeaders(ctx.headers))
    return { data: { message: 'Perfil atualizado.' } }
  },
}
