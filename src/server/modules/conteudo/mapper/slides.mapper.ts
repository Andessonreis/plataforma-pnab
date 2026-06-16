import type { SlideDestaque } from '@prisma/client'
import type { SlideDTO } from '@shared/dtos/slides.dto'

export function toSlideDTO(slide: SlideDestaque): SlideDTO {
  return {
    id: slide.id,
    titulo: slide.titulo,
    descricao: slide.descricao,
    imagemUrl: slide.imagemUrl,
    ctaLabel: slide.ctaLabel,
    ctaUrl: slide.ctaUrl,
    ordem: slide.ordem,
    ativo: slide.ativo,
    inicioEm: slide.inicioEm?.toISOString() ?? null,
    fimEm: slide.fimEm?.toISOString() ?? null,
    createdAt: slide.createdAt.toISOString(),
    updatedAt: slide.updatedAt.toISOString(),
  }
}
