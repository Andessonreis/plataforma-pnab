import { adaptNextRoute } from '@server/adapters/next-route'
import { slidesController } from '@server/modules/conteudo/controller/slides.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(slidesController.detail)
export const PUT = adaptNextRoute(slidesController.update)
export const DELETE = adaptNextRoute(slidesController.remove)
