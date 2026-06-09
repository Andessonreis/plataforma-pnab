import { adaptNextRoute } from '@server/adapters/next-route'
import { avaliadoresController } from '@server/modules/avaliacao/avaliadores/avaliadores.controller'

export const runtime = 'nodejs'

export const DELETE = adaptNextRoute(avaliadoresController.remove)
