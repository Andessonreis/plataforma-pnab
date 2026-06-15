import { adaptNextRoute } from '@server/adapters/next-route'
import { resultadosEditalController } from '@server/modules/editais/controller/resultados-edital.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const PATCH = adaptNextRoute(resultadosEditalController.reordenar)
