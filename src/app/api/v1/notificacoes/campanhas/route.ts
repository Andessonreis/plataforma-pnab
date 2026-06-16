import { adaptNextRoute } from '@server/adapters/next-route'
import { campanhasController } from '@server/modules/notificacoes/campanhas/campanhas.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(campanhasController.list)
export const POST = adaptNextRoute(campanhasController.create)
