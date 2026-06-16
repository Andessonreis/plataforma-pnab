import { adaptNextRoute } from '@server/adapters/next-route'
import { templatesAvaliacaoController } from '@server/modules/configuracoes/controller/templates-avaliacao.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(templatesAvaliacaoController.detail)
export const PUT = adaptNextRoute(templatesAvaliacaoController.update)
export const DELETE = adaptNextRoute(templatesAvaliacaoController.remove)
