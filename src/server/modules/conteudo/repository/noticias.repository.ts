import type { Noticia, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const noticiasRepository = {
  async listPaginated(
    page: number,
    pageSize: number,
  ): Promise<{ data: Noticia[]; total: number }> {
    const where: Prisma.NoticiaWhereInput = {}
    const [data, total] = await Promise.all([
      prisma.noticia.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.noticia.count({ where }),
    ])
    return { data, total }
  },

  findById(id: string): Promise<Noticia | null> {
    return prisma.noticia.findUnique({ where: { id } })
  },

  findBySlug(slug: string): Promise<Noticia | null> {
    return prisma.noticia.findUnique({ where: { slug } })
  },

  findSlugConflict(slug: string, exceptId?: string): Promise<Noticia | null> {
    return prisma.noticia.findFirst({
      where: exceptId ? { slug, id: { not: exceptId } } : { slug },
    })
  },

  create(data: Prisma.NoticiaCreateInput): Promise<Noticia> {
    return prisma.noticia.create({ data })
  },

  update(id: string, data: Prisma.NoticiaUpdateInput): Promise<Noticia> {
    return prisma.noticia.update({ where: { id }, data })
  },

  delete(id: string): Promise<Noticia> {
    return prisma.noticia.delete({ where: { id } })
  },
}
