import { adaptNextRoute } from '@server/adapters/next-route'
import { slidesController } from '@server/modules/conteudo/controller/slides.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(slidesController.list)
export const POST = adaptNextRoute(slidesController.create)
