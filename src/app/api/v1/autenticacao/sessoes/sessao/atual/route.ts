import { adaptNextRoute } from '@server/adapters/next-route'
import { autenticacaoController } from '@server/modules/core/autenticacao/autenticacao.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = adaptNextRoute(autenticacaoController.sessaoAtual)
