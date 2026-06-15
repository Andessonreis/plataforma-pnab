import { prisma } from '@server/lib/db'
import { purgeOldAuditLogs } from '@server/lib/audit'

interface QueryLogsParams {
  page: number
  pageSize: number
  action?: string
  userId?: string
  entity?: string
  dateFrom?: string
  dateTo?: string
}

export async function queryLogs(params: QueryLogsParams) {
  const { page, pageSize, action, userId, entity, dateFrom, dateTo } = params

  const where: Record<string, unknown> = {}
  if (action) where.action = action
  if (userId) where.userId = userId
  if (entity) where.entity = entity
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {}
    if (dateFrom) createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      createdAt.lte = end
    }
    where.createdAt = createdAt
  }

  const [data, total, distinctActions, distinctEntities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, nome: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    }),
    prisma.auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      where: { entity: { not: null } },
      orderBy: { entity: 'asc' },
    }),
  ])

  return {
    data,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    filters: {
      actions: distinctActions.map((a) => a.action),
      entities: distinctEntities.map((e) => e.entity),
    },
  }
}

export async function purge() {
  return purgeOldAuditLogs()
}
