import { adaptNextRoute } from '@server/adapters/next-route'
import { habilitadoresController } from '@server/modules/avaliacao/controller/habilitadores.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(habilitadoresController.list)
