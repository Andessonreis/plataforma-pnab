import type { FaqItem, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const faqRepository = {
  list(editalId?: string): Promise<FaqItem[]> {
    return prisma.faqItem.findMany({
      where: editalId ? { editalId } : {},
      orderBy: { ordem: 'asc' },
    })
  },

  findById(id: string): Promise<FaqItem | null> {
    return prisma.faqItem.findUnique({ where: { id } })
  },

  create(data: Prisma.FaqItemUncheckedCreateInput): Promise<FaqItem> {
    return prisma.faqItem.create({ data })
  },

  update(id: string, data: Prisma.FaqItemUncheckedUpdateInput): Promise<FaqItem> {
    return prisma.faqItem.update({ where: { id }, data })
  },

  delete(id: string): Promise<FaqItem> {
    return prisma.faqItem.delete({ where: { id } })
  },
}
