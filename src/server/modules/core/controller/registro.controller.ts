import type { RequestContext } from '@server/adapters/next-route'
import { ipFromHeaders } from '@server/lib/auth/api-caller'
import { registerSchema } from '@shared/schemas/user.schema'
import { register } from '../service/registro.service'

export const registroController = {
  async criar(ctx: RequestContext) {
    const data = registerSchema.parse(ctx.body)
    const result = await register(data, ipFromHeaders(ctx.headers))
    return { data: result, status: 201 }
  },
}
