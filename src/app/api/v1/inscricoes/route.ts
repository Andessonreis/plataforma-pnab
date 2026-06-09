import { adaptNextRoute } from '@server/adapters/next-route'
import { inscricoesController } from '@server/modules/inscricoes/inscricoes/inscricoes.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(inscricoesController.list)
