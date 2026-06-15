import { adaptNextRoute } from '@server/adapters/next-route'
import { avaliadoresController } from '@server/modules/avaliacao/controller/avaliadores.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(avaliadoresController.list)
