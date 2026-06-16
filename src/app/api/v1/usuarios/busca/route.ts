import { adaptNextRoute } from '@server/adapters/next-route'
import { usuariosController } from '@server/modules/core/controller/usuarios.controller'

export const runtime = 'nodejs'

export const GET = adaptNextRoute(usuariosController.buscar)
