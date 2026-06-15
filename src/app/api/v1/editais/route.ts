import { adaptNextRoute } from '@server/adapters/next-route'
import { editaisController } from '@server/modules/editais/controller/editais.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(editaisController.list)
