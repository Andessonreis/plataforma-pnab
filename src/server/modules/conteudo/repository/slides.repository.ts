import type { SlideDestaque, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const slidesRepository = {
  list(): Promise<SlideDestaque[]> {
    return prisma.slideDestaque.findMany({ orderBy: { ordem: 'asc' } })
  },

  findById(id: string): Promise<SlideDestaque | null> {
    return prisma.slideDestaque.findUnique({ where: { id } })
  },

  create(data: Prisma.SlideDestaqueCreateInput): Promise<SlideDestaque> {
    return prisma.slideDestaque.create({ data })
  },

  update(id: string, data: Prisma.SlideDestaqueUpdateInput): Promise<SlideDestaque> {
    return prisma.slideDestaque.update({ where: { id }, data })
  },

  delete(id: string): Promise<SlideDestaque> {
    return prisma.slideDestaque.delete({ where: { id } })
  },
}
