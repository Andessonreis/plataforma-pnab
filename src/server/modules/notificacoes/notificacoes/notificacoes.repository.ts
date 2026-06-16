import type { Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const notificacoesRepository = {
  listForAdmin(params: {
    page: number
    pageSize: number
    where: Prisma.NotificationWhereInput
  }) {
    const { page, pageSize, where } = params
    return Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, nome: true, email: true } },
          campaign: { select: { id: true, titulo: true, tipo: true } },
        },
      }),
      prisma.notification.count({ where }),
    ])
  },

  listForUser(params: {
    userId: string
    page: number
    pageSize: number
    where: Prisma.NotificationWhereInput
  }) {
    const { userId, page, pageSize, where } = params
    return Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, lidaEm: null } }),
    ])
  },

  countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, lidaEm: null } })
  },

  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, lidaEm: null },
      data: { lidaEm: new Date() },
    })
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, lidaEm: null },
      data: { lidaEm: new Date() },
    })
  },
}
