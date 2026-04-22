import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconClipboard } from '@/components/ui'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Recursos — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    page?: string
    fase?: string
    status?: string
    editalId?: string
    search?: string
  }>
}

const FASES: { value: string; label: string }[] = [
  { value: 'HABILITACAO', label: 'Habilitação' },
  { value: 'RESULTADO_PRELIMINAR', label: 'Resultado Preliminar' },
  { value: 'RESULTADO_FINAL', label: 'Resultado Final' },
]

function formatFase(fase: string): string {
  return FASES.find((f) => f.value === fase)?.label ?? fase
}

export default async function AdminRecursosPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || !['ADMIN', 'HABILITADOR'].includes(session.user.role)) notFound()

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const faseFilter = params.fase || undefined
  const statusFilter = params.status || undefined // 'pendente' | 'deferido' | 'indeferido'
  const editalIdFilter = params.editalId || undefined
  const searchQuery = params.search || undefined

  const where: Record<string, unknown> = {}
  if (faseFilter) where.fase = faseFilter
  if (statusFilter === 'pendente') where.decisao = null
  if (statusFilter === 'deferido') where.decisao = 'DEFERIDO'
  if (statusFilter === 'indeferido') where.decisao = 'INDEFERIDO'

  const inscricaoWhere: Record<string, unknown> = {}
  if (editalIdFilter) inscricaoWhere.editalId = editalIdFilter
  if (searchQuery) {
    inscricaoWhere.OR = [
      { numero: { contains: searchQuery, mode: 'insensitive' } },
      { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
    ]
  }
  if (Object.keys(inscricaoWhere).length > 0) where.inscricao = inscricaoWhere

  const [recursos, total, pendentesTotal, deferidosTotal, indeferidosTotal, editais] =
    await Promise.all([
      prisma.recurso.findMany({
        where,
        include: {
          inscricao: {
            include: {
              proponente: { select: { nome: true } },
              edital: { select: { titulo: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recurso.count({ where }),
      prisma.recurso.count({ where: { decisao: null } }),
      prisma.recurso.count({ where: { decisao: 'DEFERIDO' } }),
      prisma.recurso.count({ where: { decisao: 'INDEFERIDO' } }),
      prisma.edital.findMany({
        select: { id: true, titulo: true, ano: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

  const totalPages = Math.ceil(total / pageSize)

  const filterParams = new URLSearchParams()
  if (faseFilter) filterParams.set('fase', faseFilter)
  if (statusFilter) filterParams.set('status', statusFilter)
  if (editalIdFilter) filterParams.set('editalId', editalIdFilter)
  if (searchQuery) filterParams.set('search', searchQuery)
  const baseUrl = `/admin/recursos${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Recursos</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {pendentesTotal} pendente(s) · {deferidosTotal} deferido(s) · {indeferidosTotal} indeferido(s)
          </p>
        </div>
      </FadeIn>

      {/* Filtros */}
      <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
        <form method="get" action="/admin/recursos" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1.5">Buscar</label>
              <input
                id="search" name="search" type="text" defaultValue={searchQuery}
                placeholder="Nome ou número..."
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="editalId" className="block text-sm font-medium text-slate-700 mb-1.5">Edital</label>
              <select
                id="editalId" name="editalId" defaultValue={editalIdFilter}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todos</option>
                {editais.map((e) => (
                  <option key={e.id} value={e.id}>{e.titulo} ({e.ano})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fase" className="block text-sm font-medium text-slate-700 mb-1.5">Fase</label>
              <select
                id="fase" name="fase" defaultValue={faseFilter}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todas</option>
                {FASES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                id="status" name="status" defaultValue={statusFilter}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="deferido">Deferido</option>
                <option value="indeferido">Indeferido</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Filtrar</Button>
            <Button href="/admin/recursos" variant="ghost">Limpar</Button>
          </div>
        </form>
      </Card>

      {recursos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title="Nenhum recurso encontrado"
            description="Ajuste os filtros ou aguarde novos recursos."
          />
        </Card>
      ) : (
        <>
          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {recursos.map((r) => (
              <Link
                key={r.id}
                href={`/admin/inscricoes/${r.inscricaoId}`}
                className="block rounded-lg border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-slate-900 truncate">{r.inscricao.proponente.nome}</p>
                  {r.decisao ? (
                    <Badge variant={r.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                      {r.decisao === 'DEFERIDO' ? 'Deferido' : 'Indeferido'}
                    </Badge>
                  ) : (
                    <Badge variant="warning">Pendente</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-1 line-clamp-1">{r.inscricao.edital.titulo}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{formatFase(r.fase)}</span>
                  <span>·</span>
                  <span>{formatDate(r.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop */}
          <Card padding="sm" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Proponente</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Edital</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Fase</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {recursos.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{r.inscricao.proponente.nome}</td>
                      <td className="py-3 px-4 text-slate-600">{r.inscricao.edital.titulo}</td>
                      <td className="py-3 px-4">
                        <Badge variant="neutral">{formatFase(r.fase)}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(r.createdAt)}</td>
                      <td className="py-3 px-4">
                        {r.decisao ? (
                          <Badge variant={r.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                            {r.decisao === 'DEFERIDO' ? 'Deferido' : 'Indeferido'}
                          </Badge>
                        ) : (
                          <Badge variant="warning">Pendente</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/inscricoes/${r.inscricaoId}`}
                          className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                        >
                          {r.decisao ? 'Ver' : 'Decidir'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} className="mt-4 sm:mt-6" />
        </>
      )}
    </section>
  )
}
