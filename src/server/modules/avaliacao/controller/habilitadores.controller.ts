import type { RequestContext } from '@server/adapters/next-route'
import { requireRole } from '@server/lib/auth/guards'
import { listHabilitadores } from '../service/habilitadores.service'

export const habilitadoresController = {
  async list(ctx: RequestContext) {
    await requireRole(ctx.headers, 'ADMIN')
    const habilitadores = await listHabilitadores()
    return { data: habilitadores }
  },
}
