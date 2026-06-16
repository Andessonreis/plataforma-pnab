import { adaptNextRoute } from '@server/adapters/next-route'
import { contempladosController } from '@server/modules/editais/controller/contemplados.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(contempladosController.import)
