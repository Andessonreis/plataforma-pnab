import { adaptNextRoute } from '@server/adapters/next-route'
import { campanhasController } from '@server/modules/notificacoes/campanhas/campanhas.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(campanhasController.detail)
export const PUT = adaptNextRoute(campanhasController.update)
export const DELETE = adaptNextRoute(campanhasController.remove)
