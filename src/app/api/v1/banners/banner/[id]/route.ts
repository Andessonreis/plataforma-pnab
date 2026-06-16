import { adaptNextRoute } from '@server/adapters/next-route'
import { bannersController } from '@server/modules/conteudo/controller/banners.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(bannersController.detail)
export const PUT = adaptNextRoute(bannersController.update)
export const DELETE = adaptNextRoute(bannersController.remove)
