import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import {
  categoriaCreateSchema,
  categoriaReorderSchema,
  categoriaUpdateSchema,
} from '@shared/schemas/configuracoes-categorias.schema'
import {
  createCategoria,
  deleteCategoria,
  listCategorias,
  reorderCategorias,
  updateCategoria,
} from '../service/categorias.service'
import { toCategoriaDTO } from '../mapper/categorias.mapper'

export const categoriasController = {
  async list(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const includeInactive = ctx.query.all === 'true'
    const categorias = await listCategorias(includeInactive)
    return { data: categorias.map(toCategoriaDTO) }
  },

  async create(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = categoriaCreateSchema.parse(ctx.body)
    const categoria = await createCategoria(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toCategoriaDTO(categoria), status: 201 }
  },

  async update(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = categoriaUpdateSchema.parse(ctx.body)
    const categoria = await updateCategoria(ctx.params.id, data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: toCategoriaDTO(categoria) }
  },

  async remove(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    await deleteCategoria(ctx.params.id, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Categoria excluída.' } }
  },

  async reorder(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
    const data = categoriaReorderSchema.parse(ctx.body)
    await reorderCategorias(data, caller.userId, ipFromHeaders(ctx.headers))
    return { data: { message: 'Categorias reordenadas.' } }
  },
}
