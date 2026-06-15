import { adaptNextRoute } from '@server/adapters/next-route'
import { apiKeysController } from '@server/modules/core/controller/api-keys.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(apiKeysController.list)
export const POST = adaptNextRoute(apiKeysController.create)
