import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'
import { sanitizeContent } from '@shared/sanitize'
import { generateSimpleSlug } from '@shared/utils/slug'
import { ServiceError } from '@shared/service-error'
import type { CmsPageInput } from '@/lib/schemas/cms'

export async function createCmsPage(data: CmsPageInput, userId: string, ip?: string) {
  let slug = generateSimpleSlug(data.titulo)
  const existingSlug = await prisma.cmsPage.findUnique({ where: { slug } })
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const page = await prisma.cmsPage.create({
    data: {
      titulo: data.titulo,
      slug,
      corpo: sanitizeContent(data.corpo),
      publicado: data.publicado,
    },
  })

  await logAudit({
    userId,
    action: 'CMS_PAGINA_CRIADA',
    entity: 'CmsPage',
    entityId: page.id,
    details: { titulo: page.titulo, slug: page.slug },
    ip,
  })

  return page
}

export async function updateCmsPage(id: string, data: CmsPageInput, userId: string, ip?: string) {
  const existing = await prisma.cmsPage.findUnique({ where: { id } })
  if (!existing) throw new ServiceError('NOT_FOUND', 'Página não encontrada.')

  let slug = existing.slug
  if (data.titulo !== existing.titulo) {
    slug = generateSimpleSlug(data.titulo)
    const slugExists = await prisma.cmsPage.findFirst({ where: { slug, id: { not: id } } })
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
  }

  const page = await prisma.cmsPage.update({
    where: { id },
    data: {
      titulo: data.titulo,
      slug,
      corpo: sanitizeContent(data.corpo),
      publicado: data.publicado,
    },
  })

  await logAudit({
    userId,
    action: 'CMS_PAGINA_ATUALIZADA',
    entity: 'CmsPage',
    entityId: page.id,
    details: { titulo: page.titulo, slug: page.slug, publicado: page.publicado },
    ip,
  })

  return page
}

export async function deleteCmsPage(id: string, userId: string, ip?: string) {
  const existing = await prisma.cmsPage.findUnique({ where: { id } })
  if (!existing) throw new ServiceError('NOT_FOUND', 'Página não encontrada.')

  await prisma.cmsPage.delete({ where: { id } })

  await logAudit({
    userId,
    action: 'CMS_PAGINA_EXCLUIDA',
    entity: 'CmsPage',
    entityId: id,
    details: { titulo: existing.titulo },
    ip,
  })
}

export async function listCmsPages() {
  return prisma.cmsPage.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function getCmsPageBySlug(slug: string) {
  const page = await prisma.cmsPage.findUnique({ where: { slug } })
  if (!page) throw new ServiceError('NOT_FOUND', 'Página não encontrada.')
  return page
}
