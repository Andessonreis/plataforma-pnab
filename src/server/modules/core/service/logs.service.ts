import type { Prisma } from '@prisma/client'
import type { LogsQueryInput } from '@shared/schemas/logs.schema'
import { getRetentionDays, purgeOldAuditLogs } from '@server/lib/audit'
import { logsRepository } from '../repository/logs.repository'

function getErrorLogRetentionDays(): number {
  const env = process.env.ERROR_LOG_RETENTION_DAYS
  if (env) {
    const parsed = parseInt(env, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 30
}

export async function purgeAuditLogs(force: boolean) {
  const removidos = force ? await logsRepository.deleteAllAuditLogs() : await purgeOldAuditLogs()

  return {
    message: `${removidos} log(s) removido(s).`,
    removidos,
    retentionDays: force ? null : getRetentionDays(),
  }
}

export async function purgeErrorLogs(force: boolean) {
  const retentionDays = getErrorLogRetentionDays()

  let removidos: number
  if (force) {
    removidos = await logsRepository.deleteAllErrorLogs()
  } else {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    removidos = await logsRepository.deleteErrorLogsOlderThan(cutoff)
  }

  return {
    message: `${removidos} log(s) de erro removido(s).`,
    removidos,
    retentionDays: force ? null : retentionDays,
  }
}

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
