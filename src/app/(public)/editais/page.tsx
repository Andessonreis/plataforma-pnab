import type { Metadata } from 'next'
import type { EditalStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { Badge, Button, Card, PageHeader, FilterTabs, EmptyState, Pagination } from '@/components/ui'
import { IconCalendar, IconCurrency, IconDocument } from '@/components/ui/icons'
import { getStatusDisplay, OPEN_STATUSES, CLOSED_STATUSES } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getNextDeadline } from '@/lib/utils/cronograma'

export const metadata: Metadata = {
  title: 'Editais',
  description: 'Consulte os editais de fomento à cultura da PNAB em Irecê/BA.',
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

type FilterTab = 'todos' | 'abertos' | 'encerrados'

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 9

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

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...'
}

function isEncerrado(status: EditalStatus): boolean {
  return CLOSED_STATUSES.includes(status)
}

function getStatusBorderClass(status: EditalStatus): string {
  if (status === 'INSCRICOES_ABERTAS') return 'border-l-4 border-l-brand-500'
  if (status === 'PUBLICADO') return 'border-l-4 border-l-accent-500'
  if (isEncerrado(status)) return 'border-l-4 border-l-slate-300'
  return ''
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

  const statusFilter = getStatusFilter(activeTab)
  const where = {
    status: statusFilter
      ? { in: statusFilter }
      : { not: 'RASCUNHO' as EditalStatus },
  }

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

  const tabs = [
    { key: 'todos', label: 'Todos', href: '/editais' },
    { key: 'abertos', label: 'Abertos', href: '/editais?status=abertos' },
    { key: 'encerrados', label: 'Encerrados', href: '/editais?status=encerrados' },
  ]

  return (
    <>
      <PageHeader
        title="Editais"
        subtitle="Consulte os editais de fomento à cultura da Política Nacional Aldir Blanc no município de Irecê/BA."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Editais' },
        ]}
      />

      {/* Conteúdo */}
      <section className="bg-slate-50 py-6 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <FilterTabs
              tabs={tabs}
              activeKey={activeTab}
              ariaLabel="Filtrar editais por status"
            />
            <p className="text-sm text-slate-500">
              {total} {total === 1 ? 'edital encontrado' : 'editais encontrados'}
            </p>
          </div>

          {editais.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {editais.map((edital) => {
                  const statusDisplay = getStatusDisplay(edital.status)
                  const nextDeadline = getNextDeadline(edital.cronograma)
                  const encerrado = isEncerrado(edital.status)

                  return (
                    <Card
                      key={edital.id}
                      hover
                      padding="md"
                      className={[
                        'flex flex-col hover:-translate-y-0.5 transition-all duration-200',
                        getStatusBorderClass(edital.status),
                        encerrado ? 'opacity-75 hover:opacity-100' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {edital.categorias.slice(0, 3).map((cat) => (
                            <span
                              key={cat}
                              className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                        <Badge variant={statusDisplay.badgeVariant} dot>
                          {statusDisplay.label}
                        </Badge>
                      </div>

                      <h2 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                        {edital.titulo}
                      </h2>

                      {edital.resumo && (
                        <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                          {truncate(edital.resumo, 150)}
                        </p>
                      )}

                      <div className="mt-auto pt-4 space-y-2 text-sm text-slate-600">
                        {nextDeadline && (
                          <p className="flex items-center gap-2">
                            <IconCalendar className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>
                              <span className="font-medium">{nextDeadline.label}:</span>{' '}
                              {formatDate(nextDeadline.dataHora)}
                            </span>
                          </p>
                        )}

                        {edital.valorTotal && (
                          <p className="flex items-center gap-2">
                            <IconCurrency className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>{formatCurrency(edital.valorTotal)}</span>
                          </p>
                        )}
                      </div>

                      <Button href={`/editais/${edital.slug}`} variant="outline" className="mt-4 w-full">
                        Ver detalhes
                      </Button>
                    </Card>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={buildBaseUrl(activeTab)}
                  className="mt-10"
                />
              )}
            </>
          ) : (
            <EmptyState
              icon={<IconDocument className="h-8 w-8 text-slate-400" />}
              title="Nenhum edital encontrado"
              description={
                activeTab === 'abertos'
                  ? 'Não há editais com inscrições abertas no momento. Volte em breve!'
                  : activeTab === 'encerrados'
                    ? 'Não há editais encerrados para exibir.'
                    : 'Nenhum edital publicado até o momento. Fique atento às novidades!'
              }
              action={activeTab !== 'todos' ? { label: 'Ver todos os editais', href: '/editais' } : undefined}
            />
          )}
        </div>
      </section>
    </>
  )
}

// ── Utilitários ──────────────────────────────────────────────────────────────

function buildBaseUrl(tab: FilterTab): string {
  return tab === 'todos' ? '/editais' : `/editais?status=${tab}`
}
