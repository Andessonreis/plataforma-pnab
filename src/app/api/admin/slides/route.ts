import { slideSchema } from '@/lib/schemas/slide-destaque'
import { criarSlide, listarSlides } from '@/lib/services/slide-destaque.service'
import { rotaSlides } from './rota-slides'

export const runtime = 'nodejs'

export const GET = rotaSlides('GET', async () => ({
  status: 200,
  body: { data: await listarSlides() },
}))

export const POST = rotaSlides('POST', async (req, autor) => {
  const slide = await criarSlide(slideSchema.parse(await req.json()), autor)
  return { status: 201, body: { message: 'Slide criado com sucesso.', id: slide.id } }
})
