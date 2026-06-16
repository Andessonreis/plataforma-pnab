import { adaptNextRoute } from '@server/adapters/next-route'
import { tiposAnexoController } from '@server/modules/configuracoes/controller/tipos-anexo.controller'

export const runtime = 'nodejs'

export const PUT = adaptNextRoute(tiposAnexoController.update)
export const DELETE = adaptNextRoute(tiposAnexoController.remove)
