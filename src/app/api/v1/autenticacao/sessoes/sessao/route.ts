import { adaptNextRoute } from '@server/adapters/next-route'
import { autenticacaoController } from '@server/modules/core/autenticacao/autenticacao.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = adaptNextRoute(autenticacaoController.login)
export const DELETE = adaptNextRoute(autenticacaoController.logout)
