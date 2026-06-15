import { adaptNextRoute } from '@server/adapters/next-route'
import { editaisController } from '@server/modules/editais/controller/editais.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const PATCH = adaptNextRoute(editaisController.avancarFase)
