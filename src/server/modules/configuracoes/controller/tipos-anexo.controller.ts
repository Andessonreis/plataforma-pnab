import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import {
  tipoAnexoCreateSchema,
  tipoAnexoUpdateSchema,
} from '@shared/schemas/configuracoes-tipos-anexo.schema'
import {
  createTipoAnexo,
  deleteTipoAnexo,
  listTiposAnexo,
  updateTipoAnexo,
} from '../service/tipos-anexo.service'
import { toTipoAnexoDTO } from '../mapper/tipos-anexo.mapper'

export const tiposAnexoController = {
  async list(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const tag = ctx.query.tag ?? undefined
    const { tipos, tags } = await listTiposAnexo(tag)
    return { data: { tipos: tipos.map(toTipoAnexoDTO), tags } }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = tipoAnexoCreateSchema.parse(ctx.body)
    const tipo = await createTipoAnexo(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toTipoAnexoDTO(tipo), status: 201 }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = tipoAnexoUpdateSchema.parse(ctx.body)
    const tipo = await updateTipoAnexo(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toTipoAnexoDTO(tipo) }
  },

  async remove(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    await deleteTipoAnexo(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Tipo de anexo excluído.' } }
  },
}
