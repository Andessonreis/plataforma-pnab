import { adaptNextRoute } from '@server/adapters/next-route'
import { faqController } from '@server/modules/conteudo/controller/faq.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(faqController.create)
