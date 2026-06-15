import { adaptNextRoute } from '@server/adapters/next-route'
import { documentosInscricaoController } from '@server/modules/inscricoes/controller/documentos-inscricao.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(documentosInscricaoController.projeto)
