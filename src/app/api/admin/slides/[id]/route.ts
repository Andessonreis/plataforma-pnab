import { slideSchema } from '@/lib/schemas/slide-destaque'
import { atualizarSlide, excluirSlide } from '@/lib/services/slide-destaque.service'
import { rotaSlides } from '../rota-slides'

export const runtime = 'nodejs'

export const PUT = rotaSlides('PUT', async (req, autor, id = '') => {
  const slide = await atualizarSlide(id, slideSchema.parse(await req.json()), autor)
  return { status: 200, body: { message: 'Slide atualizado.', id: slide.id } }
})

export const DELETE = rotaSlides('DELETE', async (_req, autor, id = '') => {
  await excluirSlide(id, autor)
  return { status: 200, body: { message: 'Slide excluído com sucesso.' } }
})
