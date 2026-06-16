import type { RequestContext } from '@server/adapters/next-route'
import { BadRequestError, UnauthorizedError } from '@server/lib/http/errors'
import { resolveApiCaller, callerIsAuthenticated, ipFromHeaders } from '@server/lib/auth/api-caller'
import { updateProfileSchema } from '@shared/schemas/user.schema'
import {
  getProfile,
  removeAvatar,
  updateAvatar,
  updateProfile,
} from '../service/me.service'

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

  async uploadAvatar(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError()
    const form = ctx.body
    if (!(form instanceof FormData)) throw new BadRequestError('Arquivo não enviado.')
    const file = form.get('file')
    if (!(file instanceof Blob)) throw new BadRequestError('Arquivo não enviado.')
    const result = await updateAvatar(caller.userId, file, ipFromHeaders(ctx.headers))
    return { data: result }
  },

  async deleteAvatar(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError()
    await removeAvatar(caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Avatar removido.' } }
  },
}
