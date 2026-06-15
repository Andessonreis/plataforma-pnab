import { adaptNextRoute } from '@server/adapters/next-route'
import { cmsController } from '@server/modules/conteudo/controller/cms.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(cmsController.list)
export const POST = adaptNextRoute(cmsController.create)
