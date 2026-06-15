import { adaptNextRoute } from '@server/adapters/next-route'
import { inscricoesController } from '@server/modules/inscricoes/controller/inscricoes.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(inscricoesController.submit)
