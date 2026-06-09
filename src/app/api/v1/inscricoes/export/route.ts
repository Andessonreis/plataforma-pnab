import { adaptNextRoute } from '@server/adapters/next-route'
import { exportInscricoesController } from '@server/modules/inscricoes/export-inscricoes/export-inscricoes.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(exportInscricoesController.export)
