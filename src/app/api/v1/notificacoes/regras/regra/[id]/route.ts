import { adaptNextRoute } from '@server/adapters/next-route'
import { regrasController } from '@server/modules/notificacoes/regras/regras.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(regrasController.detail)
export const PUT = adaptNextRoute(regrasController.update)
export const DELETE = adaptNextRoute(regrasController.remove)
