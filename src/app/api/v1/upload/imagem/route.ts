import { adaptNextRoute } from '@server/adapters/next-route'
import { uploadController } from '@server/modules/conteudo/controller/upload.controller'

export const runtime = 'nodejs'

export const POST = adaptNextRoute(uploadController.imagem)
