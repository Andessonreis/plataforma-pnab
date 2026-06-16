import type { NotificationRule, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const regrasRepository = {
  list(where: Prisma.NotificationRuleWhereInput) {
    return prisma.notificationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { campaigns: true } } },
    })
  },

  findById(id: string): Promise<NotificationRule | null> {
    return prisma.notificationRule.findUnique({ where: { id } })
  },

  findDetail(id: string) {
    return prisma.notificationRule.findUnique({
      where: { id },
      include: {
        _count: { select: { campaigns: true } },
        createdBy: { select: { id: true, nome: true } },
      },
    })
  },

  findFiltro(id: string) {
    return prisma.notificationRule.findUnique({
      where: { id },
      select: { id: true, filtro: true },
    })
  },

  create(data: Prisma.NotificationRuleUncheckedCreateInput): Promise<NotificationRule> {
    return prisma.notificationRule.create({ data })
  },

  update(
    id: string,
    data: Prisma.NotificationRuleUncheckedUpdateInput,
  ): Promise<NotificationRule> {
    return prisma.notificationRule.update({ where: { id }, data })
  },

  delete(id: string): Promise<NotificationRule> {
    return prisma.notificationRule.delete({ where: { id } })
  },
}
