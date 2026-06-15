import { adaptNextRoute } from '@server/adapters/next-route'
import { logsController } from '@server/modules/core/controller/logs.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(logsController.list)
