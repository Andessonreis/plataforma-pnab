import type { CmsPage } from '@prisma/client'
import type { CmsPageDTO } from '@shared/dtos/cms.dto'

export function toCmsPageDTO(page: CmsPage): CmsPageDTO {
  return {
    id: page.id,
    titulo: page.titulo,
    slug: page.slug,
    corpo: page.corpo,
    publicado: page.publicado,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  }
}
