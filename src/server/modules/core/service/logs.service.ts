import type { Prisma } from '@prisma/client'
import type { LogsQueryInput } from '@shared/schemas/logs.schema'
import { logsRepository } from '../repository/logs.repository'

export async function queryLogs(params: LogsQueryInput) {
  const { page, pageSize, action, userId, entity, dateFrom, dateTo } = params

  const where: Prisma.AuditLogWhereInput = {}
  if (action) where.action = action
  if (userId) where.userId = userId
  if (entity) where.entity = entity
  if (dateFrom || dateTo) {
    const createdAt: Prisma.DateTimeFilter = {}
    if (dateFrom) createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      createdAt.lte = end
    }
    where.createdAt = createdAt
  }

  const [data, total, distinctActions, distinctEntities] = await Promise.all([
    logsRepository.list(where, (page - 1) * pageSize, pageSize),
    logsRepository.count(where),
    logsRepository.distinctActions(),
    logsRepository.distinctEntities(),
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
