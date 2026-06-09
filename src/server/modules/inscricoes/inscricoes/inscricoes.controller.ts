import type { RequestContext } from '@server/adapters/next-route'
import { requireAdmin, requireAuth, requireProponente } from '@server/lib/auth/guards'
import { buildPaginationMeta } from '@server/lib/http/pagination'
import {
  createInscricaoSchema,
  inscricoesAdminQuerySchema,
  inscricoesProponenteQuerySchema,
  updateInscricaoSchema,
} from '@shared/schemas/inscricoes.schema'
import {
  toInscricaoAdminItem,
  toInscricaoDetalhe,
  toInscricaoProponenteItem,
} from './inscricoes.mapper'
import {
  createInscricao,
  getInscricaoById,
  listAdmin,
  listByProponente,
  retractInscricao,
  submitInscricao,
  updateInscricao,
} from './inscricoes.service'

function ipFromHeaders(headers: Headers): string | undefined {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() ?? headers.get('x-real-ip') ?? undefined
}

export const inscricoesController = {
  async list(ctx: RequestContext) {
    await requireAdmin(ctx.headers)
    const query = inscricoesAdminQuerySchema.parse(ctx.query)
    const { items, total } = await listAdmin(query)
    return { data: items.map(toInscricaoAdminItem), meta: buildPaginationMeta(query, total) }
  },

  async listMinhas(ctx: RequestContext) {
    const user = await requireProponente(ctx.headers)
    const query = inscricoesProponenteQuerySchema.parse(ctx.query)
    const { items, total } = await listByProponente(user.id, query)
    return { data: items.map(toInscricaoProponenteItem), meta: buildPaginationMeta(query, total) }
  },

  async create(ctx: RequestContext) {
    const user = await requireProponente(ctx.headers)
    const input = createInscricaoSchema.parse(ctx.body)
    const inscricao = await createInscricao(input, user.id, ipFromHeaders(ctx.headers))
    return { data: inscricao, status: 201 }
  },

  async detail(ctx: RequestContext) {
    const user = await requireAuth(ctx.headers)
    const inscricao = await getInscricaoById(ctx.params.id, user.id, user.role)
    return { data: toInscricaoDetalhe(inscricao) }
  },

  async update(ctx: RequestContext) {
    const user = await requireProponente(ctx.headers)
    const input = updateInscricaoSchema.parse(ctx.body)
    const inscricao = await updateInscricao(ctx.params.id, input, user.id)
    return { data: toInscricaoDetalhe(inscricao) }
  },

  async submit(ctx: RequestContext) {
    const user = await requireProponente(ctx.headers)
    const result = await submitInscricao(ctx.params.id, user.id, ipFromHeaders(ctx.headers))
    return { data: result }
  },

  async retract(ctx: RequestContext) {
    const user = await requireProponente(ctx.headers)
    const result = await retractInscricao(ctx.params.id, user.id, ipFromHeaders(ctx.headers))
    return { data: result }
  },
}
