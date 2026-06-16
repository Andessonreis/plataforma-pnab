import type { Banner } from '@prisma/client'
import type { BannerDTO } from '@shared/dtos/banners.dto'

export function toBannerDTO(banner: Banner): BannerDTO {
  return {
    id: banner.id,
    titulo: banner.titulo,
    texto: banner.texto,
    ctaLabel: banner.ctaLabel,
    ctaUrl: banner.ctaUrl,
    ativo: banner.ativo,
    inicioEm: banner.inicioEm.toISOString(),
    fimEm: banner.fimEm.toISOString(),
    createdAt: banner.createdAt.toISOString(),
  }
}
