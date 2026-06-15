import type { RequestContext } from '@server/adapters/next-route'
import { UnauthorizedError } from '@server/lib/http/errors'
import { resolveApiCaller, callerIsAuthenticated } from '@server/lib/auth/api-caller'
import { createApiKeySchema } from '@shared/schemas/api-keys.schema'
import { createApiKey, revokeApiKey, listApiKeys } from '../service/api-keys.service'

export const apiKeysController = {
  async list(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError()
    const keys = await listApiKeys(caller.userId)
    return { data: keys }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError()
    const data = createApiKeySchema.parse(ctx.body)
    const result = await createApiKey(
      caller.userId,
      data.label,
      data.scopes,
      data.expiresAt ? new Date(data.expiresAt) : undefined,
    )
    return { data: result, status: 201 }
  },

  async revoke(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError()
    await revokeApiKey(ctx.params.id, caller.userId)
    return { data: { message: 'API key revogada.' } }
  },
}
