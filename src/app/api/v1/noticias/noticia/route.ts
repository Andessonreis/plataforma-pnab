import { adaptNextRoute } from '@server/adapters/next-route'
import { noticiasController } from '@server/modules/conteudo/controller/noticias.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(noticiasController.create)
