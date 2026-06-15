import { logAudit } from '@server/lib/audit'
import { sanitizeContent } from '@shared/sanitize'
import { generateContentSlug } from '@shared/utils/slug'
import type { PaginationMeta } from '@shared/dtos/common.dto'
import type { NoticiaInput } from '@shared/schemas/noticias.schema'
import { noticiasRepository } from '../repository/noticias.repository'
import { NoticiaNaoEncontradaError } from '../errors/noticias.errors'

function resolvePublicadoEm(data: NoticiaInput): Date | null {
  if (data.publicadoEm) return new Date(data.publicadoEm)
  return data.publicado ? new Date() : null
}

export async function listNoticias(page: number, pageSize: number) {
  const { data, total } = await noticiasRepository.listPaginated(page, pageSize)
  const meta: PaginationMeta = {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
  return { data, meta }
}

export async function getNoticiaBySlug(slug: string) {
  const noticia = await noticiasRepository.findBySlug(slug)
  if (!noticia) throw new NoticiaNaoEncontradaError()
  return noticia
}

export async function createNoticia(data: NoticiaInput, userId: string, ip?: string) {
  let slug = generateContentSlug(data.titulo)
  if (await noticiasRepository.findBySlug(slug)) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const noticia = await noticiasRepository.create({
    titulo: data.titulo,
    slug,
    corpo: sanitizeContent(data.corpo),
    tags: data.tags,
    imagemUrl: data.imagemUrl ?? null,
    publicado: data.publicado,
    publicadoEm: resolvePublicadoEm(data),
  })

  await logAudit({
    userId,
    action: 'NOTICIA_CRIADA',
    entity: 'Noticia',
    entityId: noticia.id,
    details: { titulo: noticia.titulo, publicado: noticia.publicado },
    ip,
  })

  return noticia
}

export async function updateNoticia(id: string, data: NoticiaInput, userId: string, ip?: string) {
  const existing = await noticiasRepository.findById(id)
  if (!existing) throw new NoticiaNaoEncontradaError()

  let slug = existing.slug
  if (data.titulo !== existing.titulo) {
    slug = generateContentSlug(data.titulo)
    if (await noticiasRepository.findSlugConflict(slug, id)) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
  }

  const noticia = await noticiasRepository.update(id, {
    titulo: data.titulo,
    slug,
    corpo: sanitizeContent(data.corpo),
    tags: data.tags,
    imagemUrl: data.imagemUrl ?? null,
    publicado: data.publicado,
    publicadoEm: resolvePublicadoEm(data),
  })

  await logAudit({
    userId,
    action: 'NOTICIA_ATUALIZADA',
    entity: 'Noticia',
    entityId: noticia.id,
    details: { titulo: noticia.titulo, publicado: noticia.publicado },
    ip,
  })

  return noticia
}

export async function deleteNoticia(id: string, userId: string, ip?: string) {
  const existing = await noticiasRepository.findById(id)
  if (!existing) throw new NoticiaNaoEncontradaError()

  await noticiasRepository.delete(id)

  await logAudit({
    userId,
    action: 'NOTICIA_EXCLUIDA',
    entity: 'Noticia',
    entityId: id,
    details: { titulo: existing.titulo },
    ip,
  })
}
