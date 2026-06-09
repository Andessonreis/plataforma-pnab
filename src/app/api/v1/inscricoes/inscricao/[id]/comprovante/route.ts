import { adaptNextRoute } from '@server/adapters/next-route'
import { documentosInscricaoController } from '@server/modules/inscricoes/documentos-inscricao/documentos-inscricao.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(documentosInscricaoController.comprovante)
