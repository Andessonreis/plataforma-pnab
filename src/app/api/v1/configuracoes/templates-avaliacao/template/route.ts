import { adaptNextRoute } from '@server/adapters/next-route'
import { templatesAvaliacaoController } from '@server/modules/configuracoes/controller/templates-avaliacao.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(templatesAvaliacaoController.create)
