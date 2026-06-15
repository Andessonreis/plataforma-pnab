import { adaptNextRoute } from '@server/adapters/next-route'
import { meController } from '@server/modules/core/controller/me.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(meController.get)
export const PUT = adaptNextRoute(meController.update)
