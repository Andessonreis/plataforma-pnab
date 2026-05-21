import type { RequestContext } from '@server/adapters/next-route'
import { requireAdmin } from '@server/lib/auth/guards'
import {
  editalSchema,
  editalQuerySchema,
  editalAcessivelSchema,
  avancarFaseInputSchema,
} from '@shared/schemas/editais.schema'
import { buildPaginationMeta } from '@server/lib/http/pagination'
import { editaisRepository } from './editais.repository'
import { EditalNaoEncontradoError } from './editais.errors'
import { toEditalDetalhe, toEditalResumo } from './editais.mapper'
import {
  avancarFase as avancarFaseService,
  createEdital as createEditalService,
  updateEdital as updateEditalService,
  updateAcessivel as updateAcessivelService,
} from './editais.service'

function ipFromHeaders(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    null
  )
}

export const editaisController = {
  async list(ctx: RequestContext) {
    const query = editalQuerySchema.parse(ctx.query)
    const { items, total } = await editaisRepository.list(query)
    return {
      data: items.map(toEditalResumo),
      meta: buildPaginationMeta(query, total),
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
    }
  },

  async detail(ctx: RequestContext) {
    const id = ctx.params.id
    const edital = await editaisRepository.findById(id)
    if (!edital) throw new EditalNaoEncontradoError()
    return {
      data: toEditalDetalhe(edital),
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
    }
  },

  async create(ctx: RequestContext) {
    const user = await requireAdmin(ctx.headers)
    const input = editalSchema.parse(ctx.body)
    const edital = await createEditalService(input, user.id, ipFromHeaders(ctx.headers) ?? undefined)
    return { data: toEditalDetalhe(edital), status: 201 }
  },

  async update(ctx: RequestContext) {
    const user = await requireAdmin(ctx.headers)
    const id = ctx.params.id
    const input = editalSchema.parse(ctx.body)
    const edital = await updateEditalService(id, input, user.id, ipFromHeaders(ctx.headers) ?? undefined)
    return { data: toEditalDetalhe(edital) }
  },

  async remove(ctx: RequestContext) {
    await requireAdmin(ctx.headers)
    const id = ctx.params.id
    const existing = await editaisRepository.findById(id)
    if (!existing) throw new EditalNaoEncontradoError()
    await editaisRepository.delete(id)
    return { data: { ok: true } }
  },

  async updateAcessivel(ctx: RequestContext) {
    const user = await requireAdmin(ctx.headers)
    const id = ctx.params.id
    const input = editalAcessivelSchema.parse(ctx.body)
    await updateAcessivelService(id, input, user.id, ipFromHeaders(ctx.headers) ?? undefined)
    return { data: { mensagem: 'Conteúdo acessível salvo' } }
  },

  async avancarFase(ctx: RequestContext) {
    const user = await requireAdmin(ctx.headers)
    const id = ctx.params.id
    const input = avancarFaseInputSchema.parse(ctx.body)
    const result = await avancarFaseService(id, input, user.id, ipFromHeaders(ctx.headers) ?? undefined)
    return { data: result }
  },
}
