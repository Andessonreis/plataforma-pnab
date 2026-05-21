import { adaptNextRoute } from '@server/adapters/next-route'
import { editaisController } from '@server/modules/editais/editais/editais.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(editaisController.detail)
export const PUT = adaptNextRoute(editaisController.update)
export const DELETE = adaptNextRoute(editaisController.remove)
