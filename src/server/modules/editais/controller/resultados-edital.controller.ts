import type { RequestContext } from '@server/adapters/next-route'
import { ipFromHeaders } from '@server/lib/auth/api-caller'
import { requireAdmin } from '@server/lib/auth/guards'
import {
  publicarResultadoInputSchema,
  reordenarResultadosInputSchema,
} from '@shared/schemas/resultados-edital.schema'
import { resultadosEditalService } from '../service/resultados-edital.service'

export const resultadosEditalController = {
  async listar(ctx: RequestContext) {
    await requireAdmin(ctx.headers)
    const editalId = ctx.params.id
    const result = await resultadosEditalService.listar(editalId)
    return { data: result }
  },

  async publicar(ctx: RequestContext) {
    const user = await requireAdmin(ctx.headers)
    const editalId = ctx.params.id
    const input = publicarResultadoInputSchema.parse(ctx.body)
    const result = await resultadosEditalService.publicar(editalId, input.fase, {
      actorId: user.id,
      ip: ipFromHeaders(ctx.headers),
    })
    return { data: result }
  },

  async reordenar(ctx: RequestContext) {
    const user = await requireAdmin(ctx.headers)
    const editalId = ctx.params.id
    const input = reordenarResultadosInputSchema.parse(ctx.body)
    await resultadosEditalService.reordenar(editalId, input.orderedIds, {
      actorId: user.id,
      ip: ipFromHeaders(ctx.headers),
    })
    return { data: { ok: true } }
  },
}
