import { logAudit } from '@server/lib/audit'
import { sanitizeContent } from '@shared/sanitize'
import { generateSimpleSlug } from '@shared/utils/slug'
import type { CmsPageInput } from '@shared/schemas/cms.schema'
import { cmsRepository } from '../repository/cms.repository'
import { CmsPaginaNaoEncontradaError } from '../errors/cms.errors'

export function listCmsPages() {
  return cmsRepository.list()
}

export async function getCmsPageBySlug(slug: string) {
  const page = await cmsRepository.findBySlug(slug)
  if (!page) throw new CmsPaginaNaoEncontradaError()
  return page
}

export async function createCmsPage(data: CmsPageInput, userId: string, ip?: string) {
  let slug = generateSimpleSlug(data.titulo)
  if (await cmsRepository.findBySlug(slug)) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const page = await cmsRepository.create({
    titulo: data.titulo,
    slug,
    corpo: sanitizeContent(data.corpo),
    publicado: data.publicado,
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
  const existing = await cmsRepository.findById(id)
  if (!existing) throw new CmsPaginaNaoEncontradaError()

  let slug = existing.slug
  if (data.titulo !== existing.titulo) {
    slug = generateSimpleSlug(data.titulo)
    if (await cmsRepository.findSlugConflict(slug, id)) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
  }

  const page = await cmsRepository.update(id, {
    titulo: data.titulo,
    slug,
    corpo: sanitizeContent(data.corpo),
    publicado: data.publicado,
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
  const existing = await cmsRepository.findById(id)
  if (!existing) throw new CmsPaginaNaoEncontradaError()

  await cmsRepository.delete(id)

  await logAudit({
    userId,
    action: 'CMS_PAGINA_EXCLUIDA',
    entity: 'CmsPage',
    entityId: id,
    details: { titulo: existing.titulo },
    ip,
  })
}
