import { adaptNextRoute } from '@server/adapters/next-route'
import { campanhasController } from '@server/modules/notificacoes/campanhas/campanhas.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(campanhasController.previewAudience)
