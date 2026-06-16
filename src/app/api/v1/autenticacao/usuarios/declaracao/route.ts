import { adaptNextRoute } from '@server/adapters/next-route'
import { declaracaoController } from '@server/modules/core/controller/declaracao.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(declaracaoController.upload)
