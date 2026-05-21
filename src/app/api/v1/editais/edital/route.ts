import { adaptNextRoute } from '@server/adapters/next-route'
import { editaisController } from '@server/modules/editais/editais/editais.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = adaptNextRoute(editaisController.create)
