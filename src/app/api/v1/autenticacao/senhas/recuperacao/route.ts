import { adaptNextRoute } from '@server/adapters/next-route'
import { usuariosController } from '@server/modules/core/usuarios/usuarios.controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = adaptNextRoute(usuariosController.solicitarRecuperacaoSenha)
