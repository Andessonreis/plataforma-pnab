import type { RequestContext } from '@server/adapters/next-route'
import { requireAdmin } from '@server/lib/auth/guards'
import {
  equipeAddInputSchema,
  equipeRemoveInputSchema,
} from '@shared/schemas/equipe-edital.schema'
import { equipeEditalService } from './equipe-edital.service'

function ipFromHeaders(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    null
  )
}

export const equipeEditalController = {
  async list(ctx: RequestContext) {
    await requireAdmin(ctx.headers)
    const editalId = ctx.params.id
    const equipe = await equipeEditalService.list(editalId)
    return { data: equipe }
  },

  async add(ctx: RequestContext) {
    const user = await requireAdmin(ctx.headers)
    const editalId = ctx.params.id
    const input = equipeAddInputSchema.parse(ctx.body)
    const result = await equipeEditalService.add(editalId, input.userIds, input.funcao, {
      actorId: user.id,
      ip: ipFromHeaders(ctx.headers),
    })
    return { data: result, status: 201 }
  },

  async remove(ctx: RequestContext) {
    const user = await requireAdmin(ctx.headers)
    const editalId = ctx.params.id
    const input = equipeRemoveInputSchema.parse(ctx.body)
    await equipeEditalService.remove(editalId, input.userId, input.funcao, {
      actorId: user.id,
      ip: ipFromHeaders(ctx.headers),
    })
    return { data: { ok: true } }
  },
}
