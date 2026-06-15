import type { Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const logsRepository = {
  list(where: Prisma.AuditLogWhereInput, skip: number, take: number) {
    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { user: { select: { id: true, nome: true, email: true, role: true } } },
    })
  },

  count(where: Prisma.AuditLogWhereInput): Promise<number> {
    return prisma.auditLog.count({ where })
  },

  distinctActions() {
    return prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    })
  },

  distinctEntities() {
    return prisma.auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      where: { entity: { not: null } },
      orderBy: { entity: 'asc' },
    })
  },
}
