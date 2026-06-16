import { z } from 'zod'
import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError, UnauthorizedError } from '@server/lib/http/errors'
import {
  resolveApiCaller,
  callerHasRole,
  callerIsAuthenticated,
} from '@server/lib/auth/api-caller'
import {
  countUnread,
  listNotificacoesAdmin,
  listNotificacoesUser,
  markAllRead,
  markRead,
  previewNotificacao,
} from './notificacoes.service'

const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  userId: z.string().optional(),
  campaignId: z.string().optional(),
  lida: z.enum(['true', 'false']).optional(),
})

const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  lida: z.enum(['true', 'false']).optional(),
})

const previewSchema = z.object({
  titulo: z.string().max(500).optional(),
  assunto: z.string().max(500).optional(),
  corpo: z.string().max(50_000).optional(),
  link: z.string().max(2000).optional(),
  ctaLabel: z.string().max(200).optional(),
})

export const notificacoesController = {
  async listAdmin(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const params = adminQuerySchema.parse(ctx.query)
    const { data, meta } = await listNotificacoesAdmin(params)
    return { data, meta }
  },

  async preview(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const parsed = previewSchema.parse(ctx.body ?? {})
    const data = await previewNotificacao(parsed)
    return { data }
  },

  async listForCaller(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError('Não autenticado.')
    const { page, pageSize, lida } = userQuerySchema.parse(ctx.query)
    const { data, meta } = await listNotificacoesUser({
      userId: caller.userId,
      page,
      pageSize,
      lida,
    })
    return { data, meta }
  },

  async markRead(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError('Não autenticado.')
    const updated = await markRead(ctx.params.id, caller.userId)
    return { data: { updated } }
  },

  async markAllRead(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) throw new UnauthorizedError('Não autenticado.')
    const updated = await markAllRead(caller.userId)
    return { data: { updated } }
  },

  async unreadCount(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerIsAuthenticated(caller)) {
      return { data: { count: 0 } }
    }
    const count = await countUnread(caller.userId)
    return { data: { count } }
  },
}
