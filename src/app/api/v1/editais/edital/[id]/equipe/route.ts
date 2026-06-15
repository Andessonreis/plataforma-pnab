import { adaptNextRoute } from '@server/adapters/next-route'
import { equipeEditalController } from '@server/modules/editais/controller/equipe-edital.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = adaptNextRoute(equipeEditalController.list)
export const POST = adaptNextRoute(equipeEditalController.add)
export const DELETE = adaptNextRoute(equipeEditalController.remove)
