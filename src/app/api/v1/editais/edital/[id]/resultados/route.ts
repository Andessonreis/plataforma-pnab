import { adaptNextRoute } from '@server/adapters/next-route'
import { resultadosEditalController } from '@server/modules/editais/resultados-edital/resultados-edital.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = adaptNextRoute(resultadosEditalController.listar)
export const POST = adaptNextRoute(resultadosEditalController.publicar)
