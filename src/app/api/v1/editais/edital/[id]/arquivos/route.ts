import { adaptNextRoute } from '@server/adapters/next-route'
import { arquivosEditalController } from '@server/modules/editais/controller/arquivos-edital.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(arquivosEditalController.list)
