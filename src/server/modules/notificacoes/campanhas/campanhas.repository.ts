import type { NotificationCampaign, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const campanhasRepository = {
  listPaginated(params: {
    page: number
    pageSize: number
    where: Prisma.NotificationCampaignWhereInput
  }) {
    const { page, pageSize, where } = params
    return Promise.all([
      prisma.notificationCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { rule: { select: { id: true, nome: true } } },
      }),
      prisma.notificationCampaign.count({ where }),
    ])
  },

  findById(id: string): Promise<NotificationCampaign | null> {
    return prisma.notificationCampaign.findUnique({ where: { id } })
  },

  findDetail(id: string) {
    return prisma.notificationCampaign.findUnique({
      where: { id },
      include: {
        rule: { select: { id: true, nome: true } },
        createdBy: { select: { id: true, nome: true } },
      },
    })
  },

  findFiltro(id: string) {
    return prisma.notificationCampaign.findUnique({
      where: { id },
      select: { id: true, filtro: true },
    })
  },

  create(data: Prisma.NotificationCampaignUncheckedCreateInput): Promise<NotificationCampaign> {
    return prisma.notificationCampaign.create({ data })
  },

  update(
    id: string,
    data: Prisma.NotificationCampaignUncheckedUpdateInput,
  ): Promise<NotificationCampaign> {
    return prisma.notificationCampaign.update({ where: { id }, data })
  },

  delete(id: string): Promise<NotificationCampaign> {
    return prisma.notificationCampaign.delete({ where: { id } })
  },
}
