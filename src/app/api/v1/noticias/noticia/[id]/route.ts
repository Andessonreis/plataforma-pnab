import { adaptNextRoute } from '@server/adapters/next-route'
import { noticiasController } from '@server/modules/conteudo/controller/noticias.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(noticiasController.detail)
export const PUT = adaptNextRoute(noticiasController.update)
export const DELETE = adaptNextRoute(noticiasController.remove)
