import { adaptNextRoute } from '@server/adapters/next-route'
import { autenticacaoController } from '@server/modules/core/controller/autenticacao.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = adaptNextRoute(autenticacaoController.refresh)
