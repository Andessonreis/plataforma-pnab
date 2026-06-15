import type { Noticia } from '@prisma/client'
import type { NoticiaDTO } from '@shared/dtos/noticias.dto'

export function toNoticiaDTO(noticia: Noticia): NoticiaDTO {
  return {
    id: noticia.id,
    titulo: noticia.titulo,
    slug: noticia.slug,
    corpo: noticia.corpo,
    tags: noticia.tags,
    imagemUrl: noticia.imagemUrl,
    publicado: noticia.publicado,
    publicadoEm: noticia.publicadoEm?.toISOString() ?? null,
    createdAt: noticia.createdAt.toISOString(),
    updatedAt: noticia.updatedAt.toISOString(),
  }
}
