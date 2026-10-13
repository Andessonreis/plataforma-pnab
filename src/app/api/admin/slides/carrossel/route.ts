import { carrosselSchema } from '@/lib/schemas/carrossel'
import { obterCarrossel, ROLES_CARROSSEL, salvarCarrossel } from '@/lib/services/carrossel.service'
import { rotaSlides } from '../rota-slides'

export const runtime = 'nodejs'

export const GET = rotaSlides('GET', async () => ({ status: 200, body: { data: await obterCarrossel() } }), ROLES_CARROSSEL)

export const PUT = rotaSlides(
  'PUT',
  async (req, autor) => {
    const data = await salvarCarrossel(carrosselSchema.parse(await req.json()), autor)
    return { status: 200, body: { message: 'Tempo de troca atualizado.', data } }
  },
  ROLES_CARROSSEL,
)
