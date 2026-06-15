import { adaptNextRoute } from '@server/adapters/next-route'
import { recursosController } from '@server/modules/recursos/controller/recursos.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(recursosController.list)
