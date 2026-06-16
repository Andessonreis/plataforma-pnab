import { adaptNextRoute } from '@server/adapters/next-route'
import { bannersController } from '@server/modules/conteudo/controller/banners.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(bannersController.create)
