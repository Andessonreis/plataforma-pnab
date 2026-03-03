import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Logs de Auditoria — Portal PNAB Irece',
}

interface Props {
  searchParams: Promise<{
    page?: string
    action?: string
    userId?: string
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

  const where: Record<string, unknown> = {}
  if (actionFilter) where.action = actionFilter
  if (userIdFilter) where.userId = userIdFilter

  const [logs, total, distinctActions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { nome: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const filterParams = new URLSearchParams()
  if (actionFilter) filterParams.set('action', actionFilter)
  if (userIdFilter) filterParams.set('userId', userIdFilter)
  const baseUrl = `/admin/logs${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Logs de Auditoria</h1>
        <p className="text-slate-600 mt-1">{total} registro(s) encontrado(s)</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6" padding="md">
        <form method="get" action="/admin/logs" className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-slate-700 mb-1.5">
              Acao
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
                  {a.action}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
            >
              Filtrar
            </button>
            <Link
              href="/admin/logs"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px] inline-flex items-center"
            >
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mt-4">Nenhum log encontrado</h2>
            <p className="text-slate-500 mt-1">Ajuste os filtros ou aguarde atividades.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Acao</th>
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
                        <Badge variant="neutral">{log.action}</Badge>
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
