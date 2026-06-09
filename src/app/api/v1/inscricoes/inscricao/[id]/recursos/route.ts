import { adaptNextRoute } from '@server/adapters/next-route'
import { recursosController } from '@server/modules/recursos/recursos/recursos.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(recursosController.list)
