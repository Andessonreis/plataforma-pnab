import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconInfo } from '@/components/ui'
import { ACTION_LABELS, actionBadgeVariant, getRetentionDays } from '@/lib/audit'
import { PurgeButton } from './purge-button'

export const metadata: Metadata = {
  title: 'Logs de Auditoria — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    page?: string
    action?: string
    userId?: string
    entity?: string
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function AdminLogsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const actionFilter = params.action || undefined
  const userIdFilter = params.userId || undefined
  const entityFilter = params.entity || undefined
  const dateFromFilter = params.dateFrom || undefined
  const dateToFilter = params.dateTo || undefined

  // Filtros dinâmicos
  const where: Record<string, unknown> = {}
  if (actionFilter) where.action = actionFilter
  if (userIdFilter) where.userId = userIdFilter
  if (entityFilter) where.entity = entityFilter
  if (dateFromFilter || dateToFilter) {
    const createdAt: Record<string, Date> = {}
    if (dateFromFilter) createdAt.gte = new Date(dateFromFilter)
    if (dateToFilter) {
      const end = new Date(dateToFilter)
      end.setHours(23, 59, 59, 999)
      createdAt.lte = end
    }
    where.createdAt = createdAt
  }

  const [logs, total, distinctActions, distinctEntities, totalAllLogs] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { nome: true, email: true, role: true } } },
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
    prisma.auditLog.count(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const filterParams = new URLSearchParams()
  if (actionFilter) filterParams.set('action', actionFilter)
  if (userIdFilter) filterParams.set('userId', userIdFilter)
  if (entityFilter) filterParams.set('entity', entityFilter)
  if (dateFromFilter) filterParams.set('dateFrom', dateFromFilter)
  if (dateToFilter) filterParams.set('dateTo', dateToFilter)
  const baseUrl = `/admin/logs${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  const retentionDays = getRetentionDays()

  return (
    <section>
      <FadeIn>
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Logs de Auditoria</h1>
            <p className="text-slate-600 mt-1">
              {total} registro(s) encontrado(s) &middot; Retenção: {retentionDays} dias
            </p>
          </div>
          <PurgeButton retentionDays={retentionDays} totalLogs={totalAllLogs} />
        </div>
      </FadeIn>

      {/* Filtros */}
      <Card className="mb-6" padding="md">
        <form method="get" action="/admin/logs" className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-slate-700 mb-1.5">
              Ação
            </label>
            <select
              id="action"
              name="action"
              defaultValue={actionFilter}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            >
              <option value="">Todas</option>
              {distinctActions.map((a) => (
                <option key={a.action} value={a.action}>
                  {ACTION_LABELS[a.action] ?? a.action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="entity" className="block text-sm font-medium text-slate-700 mb-1.5">
              Entidade
            </label>
            <select
              id="entity"
              name="entity"
              defaultValue={entityFilter}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            >
              <option value="">Todas</option>
              {distinctEntities.map((e) => (
                <option key={e.entity} value={e.entity!}>
                  {e.entity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-1.5">
              De
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              defaultValue={dateFromFilter}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-1.5">
              Até
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              defaultValue={dateToFilter}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              Filtrar
            </Button>
            <Button href="/admin/logs" variant="ghost">
              Limpar
            </Button>
          </div>
        </form>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconInfo className="h-8 w-8 text-slate-400" />}
            title="Nenhum log encontrado"
            description="Ajuste os filtros ou aguarde atividades."
          />
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Ação</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Entidade</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Detalhes</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {log.user ? (
                          <div>
                            <p className="font-medium text-slate-900">{log.user.nome}</p>
                            <p className="text-xs text-slate-500">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sistema</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={actionBadgeVariant(log.action)}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {log.entity ? (
                          <span>
                            {log.entity}
                            {log.entityId && (
                              <span className="text-xs text-slate-400 ml-1">
                                #{log.entityId.slice(0, 8)}
                              </span>
                            )}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                        {log.ip ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={baseUrl}
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
