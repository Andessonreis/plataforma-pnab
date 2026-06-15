import { adaptNextRoute } from '@server/adapters/next-route'
import { inscricoesController } from '@server/modules/inscricoes/controller/inscricoes.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(inscricoesController.detail)
export const PUT = adaptNextRoute(inscricoesController.update)
