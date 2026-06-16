import { adaptNextRoute } from '@server/adapters/next-route'
import { regrasController } from '@server/modules/notificacoes/regras/regras.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(regrasController.toggle)
