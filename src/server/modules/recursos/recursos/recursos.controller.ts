import type { RequestContext } from '@server/adapters/next-route'
import { requireAuth, requireRole } from '@server/lib/auth/guards'
import { decidirRecursoSchema, submeterRecursoSchema } from '@shared/schemas/recursos.schema'
import { toRecurso } from './recursos.mapper'
import { decideRecurso, listRecursos, submitRecurso } from './recursos.service'

function ipFromHeaders(headers: Headers): string | undefined {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() ?? headers.get('x-real-ip') ?? undefined
}

export const recursosController = {
  async list(ctx: RequestContext) {
    const user = await requireAuth(ctx.headers)
    const recursos = await listRecursos(ctx.params.id, user.id, user.role)
    return { data: recursos.map(toRecurso) }
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
}
