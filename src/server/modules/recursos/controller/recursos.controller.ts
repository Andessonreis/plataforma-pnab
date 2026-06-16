import type { RequestContext } from '@server/adapters/next-route'
import { ipFromHeaders } from '@server/lib/auth/api-caller'
import { requireAuth, requireProponente, requireRole } from '@server/lib/auth/guards'
import { BadRequestError } from '@server/lib/http/errors'
import {
  decidirRecursoSchema,
  listarRecursosQuerySchema,
  responderRecursoSchema,
  submeterRecursoSchema,
} from '@shared/schemas/recursos.schema'
import { toRecurso } from '../mapper/recursos.mapper'
import {
  decideRecurso,
  getAnexoRecursoSignedUrl,
  listAllRecursos,
  listRecursos,
  responderRecurso,
  submitRecurso,
  uploadAnexoRecurso,
} from '../service/recursos.service'

export const recursosController = {
  async list(ctx: RequestContext) {
    const user = await requireAuth(ctx.headers)
    const recursos = await listRecursos(ctx.params.id, user.id, user.role)
    return { data: recursos.map(toRecurso) }
  },

  async listAll(ctx: RequestContext) {
    await requireRole(ctx.headers, 'ADMIN', 'HABILITADOR')
    const params = listarRecursosQuerySchema.parse(ctx.query)
    const result = await listAllRecursos(params)
    return { data: result.data, meta: result.meta }
  },

  async submit(ctx: RequestContext) {
    const user = await requireAuth(ctx.headers)
    const input = submeterRecursoSchema.parse(ctx.body)
    const recurso = await submitRecurso(ctx.params.id, input, user.id, ipFromHeaders(ctx.headers))
    return { data: toRecurso(recurso), status: 201 }
  },

  async decide(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN', 'HABILITADOR')
    const input = decidirRecursoSchema.parse(ctx.body)
    const result = await decideRecurso(ctx.params.id, ctx.params.rid, input, user.id, ipFromHeaders(ctx.headers))
    return { data: result }
  },

  async respond(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'AVALIADOR')
    const input = responderRecursoSchema.parse(ctx.body)
    const estado = await responderRecurso(
      ctx.params.id,
      ctx.params.rid,
      input,
      user.id,
      ipFromHeaders(ctx.headers),
    )
    return { data: { estado } }
  },

  async signedUrl(ctx: RequestContext) {
    const user = await requireAuth(ctx.headers)
    const url = ctx.query.url
    if (!url) throw new BadRequestError('Parâmetro url é obrigatório.')
    const result = await getAnexoRecursoSignedUrl(ctx.params.id, ctx.params.rid, url, user)
    return { data: result, cacheControl: 'no-store' }
  },

  async uploadAnexo(ctx: RequestContext) {
    const user = await requireProponente(ctx.headers)
    if (!(ctx.body instanceof FormData)) throw new BadRequestError('Use multipart/form-data')
    const file = ctx.body.get('file')
    if (!(file instanceof File)) throw new BadRequestError('Campo "file" obrigatório')
    const result = await uploadAnexoRecurso(ctx.params.id, file, user.id, ipFromHeaders(ctx.headers))
    return { data: result, status: 201 }
  },
}
