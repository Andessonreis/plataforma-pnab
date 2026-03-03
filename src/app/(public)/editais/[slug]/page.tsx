import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui'
import { getStatusDisplay } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>
}

interface CronogramaItem {
  label: string
  dataHora: string
  destaque?: boolean
}

interface FaqItemData {
  id: string
  pergunta: string
  resposta: string
  ordem: number
}

// ── Ícones inline ─────────────────────────────────────────────────────────────

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function IconAccessible({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { titulo: true, resumo: true, status: true },
  })

  if (!edital || edital.status === 'RASCUNHO') {
    return { title: 'Edital não encontrado' }
  }

  return {
    title: edital.titulo,
    description: edital.resumo ?? `Detalhes do edital ${edital.titulo}`,
  }
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function EditalPage({ params }: Props) {
  const { slug } = await params

  const edital = await prisma.edital.findUnique({
    where: { slug },
    include: {
      arquivos: {
        orderBy: { createdAt: 'asc' },
      },
      faqItems: {
        where: { publicado: true },
        orderBy: { ordem: 'asc' },
      },
    },
  })

  if (!edital || edital.status === 'RASCUNHO') {
    notFound()
  }

  const statusDisplay = getStatusDisplay(edital.status)
  const cronograma = parseCronograma(edital.cronograma)
  const now = new Date()
  const isOpen = edital.status === 'INSCRICOES_ABERTAS'

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-r from-brand-700 to-brand-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-brand-200">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/editais" className="hover:text-white transition-colors">
                  Editais
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium truncate max-w-[200px]" aria-current="page">
                {edital.titulo}
              </li>
            </ol>
          </nav>

          {/* Título e metadados */}
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <Badge variant={statusDisplay.badgeVariant} className="text-sm">
              {statusDisplay.label}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {edital.titulo}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-brand-100">
            {/* Categorias */}
            {edital.categorias.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {edital.categorias.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Valor */}
            {edital.valorTotal && (
              <span className="inline-flex items-center gap-1.5 text-lg font-semibold text-white">
                {formatCurrency(edital.valorTotal)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Conteúdo principal */}
      <section className="bg-slate-50 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna principal (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Resumo */}
              {edital.resumo && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Sobre o Edital
                  </h2>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {edital.resumo}
                  </div>
                </div>
              )}

              {/* Cronograma / Timeline */}
              {cronograma.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">
                    Cronograma
                  </h2>
                  <div className="relative">
                    {/* Linha vertical */}
                    <div
                      className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />

                    <ol className="space-y-6">
                      {cronograma.map((item, index) => {
                        const itemDate = new Date(item.dataHora)
                        const isPast = itemDate < now
                        const isHighlight = item.destaque === true

                        return (
                          <li key={index} className="relative pl-10">
                            {/* Dot */}
                            <div
                              className={[
                                'absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2',
                                isPast
                                  ? 'bg-slate-300 border-slate-300'
                                  : isHighlight
                                    ? 'bg-brand-600 border-brand-600'
                                    : 'bg-white border-brand-400',
                              ].join(' ')}
                              aria-hidden="true"
                            />

                            <div
                              className={[
                                'rounded-lg p-3',
                                isPast
                                  ? 'opacity-60'
                                  : isHighlight
                                    ? 'bg-brand-50 border border-brand-200'
                                    : '',
                              ].join(' ')}
                            >
                              <time
                                dateTime={item.dataHora}
                                className={[
                                  'block text-sm font-semibold',
                                  isPast ? 'text-slate-400' : 'text-brand-700',
                                ].join(' ')}
                              >
                                {formatDateTime(item.dataHora)}
                              </time>
                              <span
                                className={[
                                  'block mt-0.5',
                                  isPast ? 'text-slate-500' : 'text-slate-900',
                                  isHighlight && !isPast ? 'font-medium' : '',
                                ].join(' ')}
                              >
                                {item.label}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                </div>
              )}

              {/* Arquivos para download */}
              {edital.arquivos.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Arquivos para Download
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 pr-4 font-medium text-slate-600">
                            Documento
                          </th>
                          <th className="text-left py-3 pr-4 font-medium text-slate-600">
                            Tipo
                          </th>
                          <th className="text-left py-3 pr-4 font-medium text-slate-600">
                            Acessível
                          </th>
                          <th className="text-right py-3 font-medium text-slate-600">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {edital.arquivos.map((arquivo) => (
                          <tr
                            key={arquivo.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 pr-4 font-medium text-slate-900">
                              {arquivo.titulo}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={getFileBadgeVariant(arquivo.tipo)}>
                                {arquivo.tipo}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              {arquivo.acessivel ? (
                                <span className="inline-flex items-center gap-1 text-brand-700">
                                  <IconAccessible className="h-4 w-4" />
                                  <span className="text-xs font-medium">Sim</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <a
                                href={arquivo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                                download
                              >
                                <IconDownload className="h-4 w-4" />
                                Baixar
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Regras de Elegibilidade */}
              {edital.regrasElegibilidade && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <IconShield className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 pt-1">
                      Regras de Elegibilidade
                    </h2>
                  </div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {edital.regrasElegibilidade}
                  </div>
                </div>
              )}

              {/* Ações Afirmativas */}
              {edital.acoesAfirmativas && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 shrink-0">
                      <IconHeart className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 pt-1">
                      Ações Afirmativas
                    </h2>
                  </div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {edital.acoesAfirmativas}
                  </div>
                </div>
              )}

              {/* FAQ do Edital */}
              {edital.faqItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">
                    Perguntas Frequentes
                  </h2>
                  <FaqAccordion items={edital.faqItems} />
                </div>
              )}
            </div>

            {/* Sidebar (1/3) */}
            <aside className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* CTA de inscrição */}
                {isOpen && (
                  <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">
                      Inscrições Abertas
                    </h3>
                    <p className="text-brand-100 text-sm mb-5 leading-relaxed">
                      Cadastre-se ou acesse sua conta para inscrever seu projeto
                      cultural neste edital.
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center w-full rounded-lg bg-white text-brand-700 px-5 py-3 text-base font-semibold hover:bg-brand-50 transition-colors shadow-md min-h-[44px]"
                    >
                      Inscrever-se
                    </Link>
                    <p className="mt-3 text-center text-xs text-brand-200">
                      Ainda não tem conta?{' '}
                      <Link href="/cadastro" className="underline hover:text-white">
                        Cadastre-se
                      </Link>
                    </p>
                  </div>
                )}

                {/* Informações rápidas */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-4">
                    Informações
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Status</dt>
                      <dd className="mt-0.5">
                        <Badge variant={statusDisplay.badgeVariant}>
                          {statusDisplay.label}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Ano</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{edital.ano}</dd>
                    </div>
                    {edital.valorTotal && (
                      <div>
                        <dt className="text-slate-500">Valor Total</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">
                          {formatCurrency(edital.valorTotal)}
                        </dd>
                      </div>
                    )}
                    {edital.categorias.length > 0 && (
                      <div>
                        <dt className="text-slate-500">Categorias</dt>
                        <dd className="mt-1 flex flex-wrap gap-1.5">
                          {edital.categorias.map((cat) => (
                            <Badge key={cat} variant="neutral">{cat}</Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-slate-500">Publicado em</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">
                        {formatDate(edital.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Próxima data do cronograma */}
                {(() => {
                  const nextItem = cronograma.find(
                    (item) => new Date(item.dataHora) > now,
                  )
                  if (!nextItem) return null

                  return (
                    <div className="bg-accent-50 rounded-xl border border-accent-200 p-6">
                      <h3 className="text-base font-semibold text-accent-900 mb-1">
                        Próxima data
                      </h3>
                      <p className="text-sm text-accent-800 font-medium">
                        {nextItem.label}
                      </p>
                      <p className="text-sm text-accent-700 mt-1">
                        {formatDateTime(nextItem.dataHora)}
                      </p>
                    </div>
                  )
                })()}

                {/* Link de volta */}
                <Link
                  href="/editais"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  Voltar para editais
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseCronograma(raw: unknown): CronogramaItem[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (item): item is CronogramaItem =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.label === 'string' &&
      typeof item.dataHora === 'string',
  )
}

function getFileBadgeVariant(tipo: string): 'info' | 'warning' | 'success' | 'neutral' {
  switch (tipo.toUpperCase()) {
    case 'PDF':
      return 'info'
    case 'ANEXO':
      return 'warning'
    case 'MODELO':
    case 'DECLARACAO':
      return 'success'
    case 'PLANILHA':
      return 'neutral'
    default:
      return 'neutral'
  }
}

// ── Componente FAQ Accordion (client component inline via details/summary) ───

function FaqAccordion({ items }: { items: FaqItemData[] }) {
  return (
    <div className="divide-y divide-slate-200">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-medium text-slate-900 group-open:text-brand-700">
              {item.pergunta}
            </span>
            <IconChevronDown className="h-5 w-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-4 text-sm text-slate-600 leading-relaxed">
            {item.resposta}
          </div>
        </details>
      ))}
    </div>
  )
}
