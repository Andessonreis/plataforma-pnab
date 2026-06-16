import { adaptNextRoute } from '@server/adapters/next-route'
import { ticketsController } from '@server/modules/atendimento/controller/tickets.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(ticketsController.create)
