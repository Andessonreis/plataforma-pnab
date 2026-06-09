import { adaptNextRoute } from '@server/adapters/next-route'
import { avaliacaoController } from '@server/modules/avaliacao/avaliacao/avaliacao.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(avaliacaoController.detail)
export const PUT = adaptNextRoute(avaliacaoController.save)
