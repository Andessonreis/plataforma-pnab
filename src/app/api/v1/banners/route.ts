import { adaptNextRoute } from '@server/adapters/next-route'
import { bannersController } from '@server/modules/conteudo/controller/banners.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(bannersController.list)
export const POST = adaptNextRoute(bannersController.create)
