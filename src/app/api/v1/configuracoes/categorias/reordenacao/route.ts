import { adaptNextRoute } from '@server/adapters/next-route'
import { categoriasController } from '@server/modules/configuracoes/controller/categorias.controller'

export const runtime = 'nodejs'

export const PUT = adaptNextRoute(categoriasController.reorder)
