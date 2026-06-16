import { z } from 'zod'
import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import { campaignSchema } from '@shared/schemas/notifications.schema'
import {
  cancelCampanha,
  createCampanha,
  deleteCampanha,
  getCampanha,
  listCampanhas,
  previewCampanhaAudience,
  sendCampanha,
  updateCampanha,
} from './campanhas.service'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['RASCUNHO', 'ENVIANDO', 'ENVIADA', 'CANCELADA', 'FALHA']).optional(),
})

async function requireAdmin(ctx: RequestContext) {
  const caller = await resolveApiCaller(ctx.headers)
  if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
  return caller
}

export const campanhasController = {
  async list(ctx: RequestContext) {
    await requireAdmin(ctx)
    const { page, pageSize, status } = listQuerySchema.parse(ctx.query)
    const { data, meta } = await listCampanhas({ page, pageSize, status })
    return { data, meta }
  },

  async detail(ctx: RequestContext) {
    await requireAdmin(ctx)
    const campaign = await getCampanha(ctx.params.id)
    return { data: campaign }
  },

  async create(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    const data = campaignSchema.parse(ctx.body)
    const campaign = await createCampanha(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Campanha criada.', id: campaign.id }, status: 201 }
  },

  async update(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    const data = campaignSchema.parse(ctx.body)
    const campaign = await updateCampanha(
      ctx.params.id,
      data,
      caller.userId,
      ipFromHeaders(ctx.headers),
    )
    return { data: { message: 'Campanha atualizada.', id: campaign.id } }
  },

  async remove(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    await deleteCampanha(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Campanha excluída.' } }
  },

  async send(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    const result = await sendCampanha(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Disparo enfileirado.', ...result } }
  },

  async cancel(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    await cancelCampanha(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Campanha cancelada.' } }
  },

  async previewAudience(ctx: RequestContext) {
    await requireAdmin(ctx)
    const total = await previewCampanhaAudience(ctx.params.id)
    return { data: { total } }
  },
}
