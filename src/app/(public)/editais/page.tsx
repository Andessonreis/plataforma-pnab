import type { Metadata } from 'next'
import Link from 'next/link'
import type { EditalStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui'
import { getStatusDisplay, OPEN_STATUSES, CLOSED_STATUSES } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Editais',
  description: 'Consulte os editais de fomento à cultura da PNAB em Irecê/BA.',
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

type FilterTab = 'todos' | 'abertos' | 'encerrados'

interface CronogramaItem {
  label: string
  dataHora: string
  destaque?: boolean
}

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 9

// ── Ícones inline ─────────────────────────────────────────────────────────────

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
    </svg>
  )
}

function IconCurrency({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  )
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getStatusFilter(tab: FilterTab): EditalStatus[] | undefined {
  switch (tab) {
    case 'abertos':
      return OPEN_STATUSES
    case 'encerrados':
      return CLOSED_STATUSES
    default:
      return undefined
  }
}

/** Encontra a próxima data futura no cronograma */
function getNextDeadline(cronograma: unknown): CronogramaItem | null {
  if (!Array.isArray(cronograma)) return null

  const now = new Date()
  const items = cronograma as CronogramaItem[]

  const future = items
    .filter((item) => item.dataHora && new Date(item.dataHora) > now)
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())

  return future[0] ?? null
}

/** Trunca texto mantendo palavras completas */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...'
}

// ── Componente principal ──────────────────────────────────────────────────────

export default async function EditaisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const activeTab = (['todos', 'abertos', 'encerrados'] as FilterTab[]).includes(
    params.status as FilterTab,
  )
    ? (params.status as FilterTab)
    : 'todos'

  const currentPage = Math.max(1, Number(params.page) || 1)

  // Montar filtro de status — sempre excluir RASCUNHO
  const statusFilter = getStatusFilter(activeTab)
  const where = {
    status: statusFilter
      ? { in: statusFilter }
      : { not: 'RASCUNHO' as EditalStatus },
  }

  // Buscar editais com contagem total
  const [editais, total] = await Promise.all([
    prisma.edital.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.edital.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Tabs de filtro
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'abertos', label: 'Abertos' },
    { key: 'encerrados', label: 'Encerrados' },
  ]

  return (
    <>
      {/* Header da página */}
      <section className="bg-gradient-to-r from-brand-700 to-brand-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-brand-200">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium" aria-current="page">
                Editais
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Editais
          </h1>
          <p className="mt-3 text-lg text-brand-100 max-w-2xl">
            Consulte os editais de fomento à cultura da Política Nacional Aldir Blanc
            no município de Irecê/BA.
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="bg-slate-50 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filtros (tabs) */}
          <div className="mb-8">
            <nav
              aria-label="Filtrar editais por status"
              className="inline-flex rounded-lg bg-slate-200/60 p-1"
            >
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab
                const href =
                  tab.key === 'todos'
                    ? '/editais'
                    : `/editais?status=${tab.key}`

                return (
                  <Link
                    key={tab.key}
                    href={href}
                    className={[
                      'px-4 py-2 text-sm font-medium rounded-md transition-all min-h-[44px] inline-flex items-center',
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Grid de editais */}
          {editais.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {editais.map((edital) => {
                  const statusDisplay = getStatusDisplay(edital.status)
                  const nextDeadline = getNextDeadline(edital.cronograma)

                  return (
                    <article
                      key={edital.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="p-6 flex flex-col flex-1">
                        {/* Categorias + Status */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex flex-wrap gap-1.5">
                            {edital.categorias.slice(0, 3).map((cat) => (
                              <span
                                key={cat}
                                className="text-xs font-medium text-slate-500 uppercase tracking-wider"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                          <Badge variant={statusDisplay.badgeVariant}>
                            {statusDisplay.label}
                          </Badge>
                        </div>

                        {/* Título */}
                        <h2 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                          {edital.titulo}
                        </h2>

                        {/* Resumo */}
                        {edital.resumo && (
                          <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                            {truncate(edital.resumo, 150)}
                          </p>
                        )}

                        {/* Metadados */}
                        <div className="mt-auto pt-4 space-y-2 text-sm text-slate-600">
                          {/* Próxima data */}
                          {nextDeadline && (
                            <p className="flex items-center gap-2">
                              <IconCalendar className="h-4 w-4 text-slate-400 shrink-0" />
                              <span>
                                <span className="font-medium">{nextDeadline.label}:</span>{' '}
                                {formatDate(nextDeadline.dataHora)}
                              </span>
                            </p>
                          )}

                          {/* Valor */}
                          {edital.valorTotal && (
                            <p className="flex items-center gap-2">
                              <IconCurrency className="h-4 w-4 text-slate-400 shrink-0" />
                              <span>{formatCurrency(edital.valorTotal)}</span>
                            </p>
                          )}
                        </div>

                        {/* Link */}
                        <Link
                          href={`/editais/${edital.slug}`}
                          className="mt-4 inline-flex items-center justify-center w-full rounded-lg border-2 border-brand-600 text-brand-700 px-4 py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors min-h-[44px]"
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <nav
                  aria-label="Paginação dos editais"
                  className="mt-10 flex items-center justify-center gap-2"
                >
                  {/* Anterior */}
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageUrl(activeTab, currentPage - 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
                    >
                      <IconChevronLeft className="h-4 w-4" />
                      Anterior
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed min-h-[44px]">
                      <IconChevronLeft className="h-4 w-4" />
                      Anterior
                    </span>
                  )}

                  {/* Indicador de página */}
                  <span className="px-4 py-2 text-sm text-slate-600">
                    Página <span className="font-semibold text-slate-900">{currentPage}</span> de{' '}
                    <span className="font-semibold text-slate-900">{totalPages}</span>
                  </span>

                  {/* Próxima */}
                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageUrl(activeTab, currentPage + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
                    >
                      Próxima
                      <IconChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed min-h-[44px]">
                      Próxima
                      <IconChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </nav>
              )}
            </>
          ) : (
            /* Estado vazio */
            <div className="text-center py-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-6">
                <IconDocument className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Nenhum edital encontrado
              </h2>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                {activeTab === 'abertos'
                  ? 'Não há editais com inscrições abertas no momento. Volte em breve!'
                  : activeTab === 'encerrados'
                    ? 'Não há editais encerrados para exibir.'
                    : 'Nenhum edital publicado até o momento. Fique atento às novidades!'}
              </p>
              {activeTab !== 'todos' && (
                <Link
                  href="/editais"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors min-h-[44px]"
                >
                  Ver todos os editais
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

// ── Utilitário para URL de paginação ──────────────────────────────────────────

function buildPageUrl(tab: FilterTab, page: number): string {
  const params = new URLSearchParams()
  if (tab !== 'todos') params.set('status', tab)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/editais?${qs}` : '/editais'
}
