import { adaptNextRoute } from '@server/adapters/next-route'
import { habilitacaoController } from '@server/modules/habilitacao/controller/habilitacao.controller'

export const runtime = 'nodejs'

export const PUT = adaptNextRoute(habilitacaoController.update)
