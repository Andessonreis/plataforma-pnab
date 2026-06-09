import { adaptNextRoute } from '@server/adapters/next-route'
import { anexosInscricaoController } from '@server/modules/inscricoes/anexos-inscricao/anexos-inscricao.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(anexosInscricaoController.upload)
