import { adaptNextRoute } from '@server/adapters/next-route'
import { notificacoesController } from '@server/modules/notificacoes/notificacoes/notificacoes.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(notificacoesController.listAdmin)
