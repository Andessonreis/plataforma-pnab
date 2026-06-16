import { adaptNextRoute } from '@server/adapters/next-route'
import { exportInscricoesController } from '@server/modules/inscricoes/controller/export-inscricoes.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(exportInscricoesController.export)
