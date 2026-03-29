import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { sanitizeContent } from '@/lib/sanitize'
import { generateContentSlug } from '@/lib/utils/slug'
import { ServiceError } from './errors'
import type { NoticiaInput } from '@/lib/schemas/noticia'

export async function createNoticia(data: NoticiaInput, userId: string, ip?: string) {
  let slug = generateContentSlug(data.titulo)
  const existingSlug = await prisma.noticia.findUnique({ where: { slug } })
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const noticia = await prisma.noticia.create({
    data: {
      titulo: data.titulo,
      slug,
      corpo: sanitizeContent(data.corpo),
      tags: data.tags,
      imagemUrl: data.imagemUrl ?? null,
      publicado: data.publicado,
      publicadoEm: data.publicadoEm
        ? new Date(data.publicadoEm)
        : data.publicado
          ? new Date()
          : null,
    },
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
  const existing = await prisma.noticia.findUnique({ where: { id } })
  if (!existing) throw new ServiceError('NOT_FOUND', 'Notícia não encontrada.')

  let slug = existing.slug
  if (data.titulo !== existing.titulo) {
    slug = generateContentSlug(data.titulo)
    const slugExists = await prisma.noticia.findFirst({ where: { slug, id: { not: id } } })
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
  }

  const noticia = await prisma.noticia.update({
    where: { id },
    data: {
      titulo: data.titulo,
      slug,
      corpo: sanitizeContent(data.corpo),
      tags: data.tags,
      imagemUrl: data.imagemUrl ?? null,
      publicado: data.publicado,
      publicadoEm: data.publicadoEm
        ? new Date(data.publicadoEm)
        : data.publicado
          ? new Date()
          : null,
    },
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
  const existing = await prisma.noticia.findUnique({ where: { id } })
  if (!existing) throw new ServiceError('NOT_FOUND', 'Notícia não encontrada.')

  await prisma.noticia.delete({ where: { id } })

  await logAudit({
    userId,
    action: 'NOTICIA_EXCLUIDA',
    entity: 'Noticia',
    entityId: id,
    details: { titulo: existing.titulo },
    ip,
  })
}

export async function listNoticias(page: number, pageSize: number) {
  const where = {}
  const [data, total] = await Promise.all([
    prisma.noticia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.noticia.count({ where }),
  ])

  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export async function getNoticiaBySlug(slug: string) {
  const noticia = await prisma.noticia.findUnique({ where: { slug } })
  if (!noticia) throw new ServiceError('NOT_FOUND', 'Notícia não encontrada.')
  return noticia
}
