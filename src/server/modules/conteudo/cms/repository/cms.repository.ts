import type { CmsPage, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const cmsRepository = {
  list(): Promise<CmsPage[]> {
    return prisma.cmsPage.findMany({ orderBy: { createdAt: 'desc' } })
  },

  findById(id: string): Promise<CmsPage | null> {
    return prisma.cmsPage.findUnique({ where: { id } })
  },

  findBySlug(slug: string): Promise<CmsPage | null> {
    return prisma.cmsPage.findUnique({ where: { slug } })
  },

  findSlugConflict(slug: string, exceptId?: string): Promise<CmsPage | null> {
    return prisma.cmsPage.findFirst({
      where: exceptId ? { slug, id: { not: exceptId } } : { slug },
    })
  },

  create(data: Prisma.CmsPageCreateInput): Promise<CmsPage> {
    return prisma.cmsPage.create({ data })
  },

  update(id: string, data: Prisma.CmsPageUpdateInput): Promise<CmsPage> {
    return prisma.cmsPage.update({ where: { id }, data })
  },

  delete(id: string): Promise<CmsPage> {
    return prisma.cmsPage.delete({ where: { id } })
  },
}
