import { adaptNextRoute } from '@server/adapters/next-route'
import { meController } from '@server/modules/core/controller/me.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(meController.uploadAvatar)
export const DELETE = adaptNextRoute(meController.deleteAvatar)
