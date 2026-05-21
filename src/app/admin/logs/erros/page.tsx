import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@server/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn } from '@client/components/ui'
import { PurgeButton } from './purge-button'

export const metadata: Metadata = {
  title: 'Logs de Erros — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    page?: string
    level?: string
    path?: string
    method?: string
    statusCode?: string
    dateFrom?: string
    dateTo?: string
    fingerprint?: string
  }>
}

function getRetentionDays(): number {
  const env = process.env.ERROR_LOG_RETENTION_DAYS
  if (env) {
    const parsed = parseInt(env, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 30
}

export default async function AdminErrorsLogsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20

  // Se um fingerprint foi passado, mostra ocorrências daquele grupo.
  // Senão, mostra listagem agrupada.
  const fingerprintFilter = params.fingerprint || undefined

  const where: Record<string, unknown> = {}
  if (fingerprintFilter) where.fingerprint = fingerprintFilter
  if (params.level) where.level = params.level
  if (params.path) where.path = { contains: params.path }
  if (params.method) where.method = params.method
  if (params.statusCode) where.statusCode = parseInt(params.statusCode, 10)
  if (params.dateFrom || params.dateTo) {
    const ts: Record<string, Date> = {}
    if (params.dateFrom) ts.gte = new Date(params.dateFrom)
    if (params.dateTo) {
      const end = new Date(params.dateTo)
      end.setHours(23, 59, 59, 999)
      ts.lte = end
    }
    where.timestamp = ts
  }

  const totalAll = await prisma.errorLog.count()

  // Modo 1: detalhe de um grupo (fingerprint)
  if (fingerprintFilter) {
    const [eventos, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.errorLog.count({ where }),
    ])
    const totalPages = Math.ceil(total / pageSize)

    return (
      <section>
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Link href="/admin/logs/erros" className="text-sm text-brand-600 hover:underline">
              ← Voltar aos grupos
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Grupo de erros
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">fingerprint: {fingerprintFilter}</p>
          </div>
          <Badge variant="neutral">{total} ocorrência(s)</Badge>
        </div>

        {eventos.length === 0 ? (
          <Card><EmptyState title="Nenhuma ocorrência" description="Este grupo não tem mais eventos." /></Card>
        ) : (
          <div className="space-y-3">
            {eventos.map((e) => (
              <Card key={e.id} padding="sm" className="sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 break-words">{e.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(e.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      {e.method && e.path && <> · <span className="font-mono">{e.method} {e.path}</span></>}
                      {e.statusCode && <> · <span className="font-mono">HTTP {e.statusCode}</span></>}
                    </p>
                    {e.requestId && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">req: {e.requestId}</p>
                    )}
                  </div>
                  <Badge variant={e.level === 'error' ? 'error' : 'warning'}>{e.level}</Badge>
                </div>
                {e.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-brand-600 cursor-pointer hover:underline">Stack trace</summary>
                    <pre className="text-[11px] text-slate-600 bg-slate-50 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap break-all">{e.stack}</pre>
                  </details>
                )}
                {e.context != null && Object.keys(e.context as object).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-brand-600 cursor-pointer hover:underline">Contexto</summary>
                    <pre className="text-[11px] text-slate-600 bg-slate-50 rounded p-2 mt-1 overflow-x-auto">{JSON.stringify(e.context, null, 2)}</pre>
                  </details>
                )}
              </Card>
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl={`/admin/logs/erros?fingerprint=${fingerprintFilter}`}
          className="mt-4 sm:mt-6"
        />
      </section>
    )
  }

  // Modo 2: grupos agregados por fingerprint
  const groups = await prisma.errorLog.groupBy({
    by: ['fingerprint'],
    where,
    _count: { _all: true },
    _max: { timestamp: true, message: true, level: true, path: true, method: true, statusCode: true },
    orderBy: { _max: { timestamp: 'desc' } },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const totalGroups = await prisma.errorLog.groupBy({
    by: ['fingerprint'],
    where,
    _count: { _all: true },
  }).then((r) => r.length)

  const totalEventos = await prisma.errorLog.count({ where })
  const totalPages = Math.ceil(totalGroups / pageSize)

  const filterParams = new URLSearchParams()
  if (params.level) filterParams.set('level', params.level)
  if (params.path) filterParams.set('path', params.path)
  if (params.method) filterParams.set('method', params.method)
  if (params.statusCode) filterParams.set('statusCode', params.statusCode)
  if (params.dateFrom) filterParams.set('dateFrom', params.dateFrom)
  if (params.dateTo) filterParams.set('dateTo', params.dateTo)
  const baseUrl = `/admin/logs/erros${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <FadeIn>
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Logs de Erros</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {totalGroups} grupo(s) · {totalEventos} ocorrência(s)
            </p>
            <nav className="flex gap-3 mt-2 text-xs">
              <Link href="/admin/logs" className="text-slate-500 hover:text-brand-700">Auditoria</Link>
              <span className="text-brand-700 font-semibold">Erros</span>
            </nav>
          </div>
          <PurgeButton retentionDays={getRetentionDays()} totalLogs={totalAll} />
        </div>
      </FadeIn>

      <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
        <form method="get" action="/admin/logs/erros" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-1.5">Nível</label>
              <select
                id="level" name="level" defaultValue={params.level}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todos</option>
                <option value="error">Error</option>
                <option value="warn">Warn</option>
              </select>
            </div>
            <div>
              <label htmlFor="path" className="block text-sm font-medium text-slate-700 mb-1.5">Path</label>
              <input
                id="path" name="path" type="text" defaultValue={params.path}
                placeholder="/api/admin/..."
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-1.5">De</label>
              <input
                id="dateFrom" name="dateFrom" type="date" defaultValue={params.dateFrom}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-1.5">Até</label>
              <input
                id="dateTo" name="dateTo" type="date" defaultValue={params.dateTo}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Filtrar</Button>
            <Button href="/admin/logs/erros" variant="ghost">Limpar</Button>
          </div>
        </form>
      </Card>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum erro registrado"
            description="Quando o sistema capturar exceções, elas aparecerão aqui agrupadas."
          />
        </Card>
      ) : (
        <Card padding="sm" className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {groups.map((g) => (
              <li key={g.fingerprint} className="py-3 px-4 hover:bg-slate-50 transition-colors">
                <Link
                  href={`/admin/logs/erros?fingerprint=${g.fingerprint}`}
                  className="flex items-start justify-between gap-3 flex-wrap"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={g._max.level === 'error' ? 'error' : 'warning'}>{g._max.level}</Badge>
                      <span className="text-xs font-mono text-slate-400">{g.fingerprint}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 break-words line-clamp-2">
                      {g._max.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {g._max.method && g._max.path && (
                        <span className="font-mono">{g._max.method} {g._max.path}</span>
                      )}
                      {g._max.statusCode && <> · <span className="font-mono">HTTP {g._max.statusCode}</span></>}
                      {g._max.timestamp && (
                        <> · última: {new Date(g._max.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</>
                      )}
                    </p>
                  </div>
                  <Badge variant="neutral" className="shrink-0">{g._count._all}×</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} className="mt-4 sm:mt-6" />
    </section>
  )
}
