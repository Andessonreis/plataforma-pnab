import { adaptNextRoute } from '@server/adapters/next-route'
import { anexosInscricaoController } from '@server/modules/inscricoes/controller/anexos-inscricao.controller'

export const runtime = 'nodejs'

export const DELETE = adaptNextRoute(anexosInscricaoController.remove)
