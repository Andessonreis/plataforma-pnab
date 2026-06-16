import type { Banner, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const bannersRepository = {
  list(): Promise<Banner[]> {
    return prisma.banner.findMany({ orderBy: { createdAt: 'desc' } })
  },

  findById(id: string): Promise<Banner | null> {
    return prisma.banner.findUnique({ where: { id } })
  },

  create(data: Prisma.BannerCreateInput): Promise<Banner> {
    return prisma.banner.create({ data })
  },

  update(id: string, data: Prisma.BannerUpdateInput): Promise<Banner> {
    return prisma.banner.update({ where: { id }, data })
  },

  delete(id: string): Promise<Banner> {
    return prisma.banner.delete({ where: { id } })
  },
}
