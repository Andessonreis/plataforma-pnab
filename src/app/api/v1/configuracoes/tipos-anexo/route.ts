import { adaptNextRoute } from '@server/adapters/next-route'
import { tiposAnexoController } from '@server/modules/configuracoes/controller/tipos-anexo.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(tiposAnexoController.list)
export const POST = adaptNextRoute(tiposAnexoController.create)
