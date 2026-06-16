import { adaptNextRoute } from '@server/adapters/next-route'
import { emailTemplatesController } from '@server/modules/email-templates/controller/email-templates.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(emailTemplatesController.testSend)
