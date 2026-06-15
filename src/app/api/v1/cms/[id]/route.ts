import { adaptNextRoute } from '@server/adapters/next-route'
import { cmsController } from '@server/modules/conteudo/cms/controller/cms.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(cmsController.detail)
export const PUT = adaptNextRoute(cmsController.update)
export const DELETE = adaptNextRoute(cmsController.remove)
