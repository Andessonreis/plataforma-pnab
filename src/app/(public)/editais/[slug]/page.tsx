import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { Badge, Button, PageHeader } from '@/components/ui'
import {
  IconDownload,
  IconCheckSimple,
  IconShield,
  IconHeart,
  IconChevronDown,
  IconAccessible,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconCurrency,
  IconDocument,
  IconQuestion,
} from '@/components/ui/icons'
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
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

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

  if (!edital || (!isAdmin && edital.status === 'RASCUNHO')) {
    notFound()
  }

  const statusDisplay = getStatusDisplay(edital.status)
  const cronograma = parseCronograma(edital.cronograma)
  const now = new Date()
  const isOpen = edital.status === 'INSCRICOES_ABERTAS'

  const nextDeadline = cronograma.find((item) => new Date(item.dataHora) > now)

  return (
    <>
      {isAdmin && edital.status === 'RASCUNHO' && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center text-sm text-amber-800 font-medium">
          Pré-visualização de rascunho &mdash; este edital não está visível ao público.{' '}
          <Link href={`/admin/editais/${edital.id}`} className="underline hover:text-amber-900">
            Editar edital
          </Link>
        </div>
      )}
      <PageHeader
        title={edital.titulo}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Editais', href: '/editais' },
          { label: edital.titulo },
        ]}
      >
        {/* Metadata no header */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge variant={statusDisplay.badgeVariant} className="text-sm" dot>
            {statusDisplay.label}
          </Badge>
          {edital.categorias.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-white"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Destaques rápidos */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 sm:gap-6 text-brand-100 text-sm">
          {edital.valorTotal && (
            <span className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-white">
              <IconCurrency className="h-5 w-5 text-brand-200" />
              {formatCurrency(edital.valorTotal)}
            </span>
          )}
          {nextDeadline && (
            <span className="inline-flex items-center gap-2">
              <IconClock className="h-4 w-4 text-brand-200" />
              <span className="font-medium text-white">{nextDeadline.label}:</span>{' '}
              {formatDate(nextDeadline.dataHora)}
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-brand-200" />
            Publicado em {formatDate(edital.createdAt)}
          </span>
        </div>
      </PageHeader>

      {/* Conteúdo principal */}
      <section className="bg-slate-50 py-6 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Coluna principal (2/3) */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-8">
              {/* Resumo */}
              {edital.resumo && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                      <IconDocument className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 pt-1">
                      Sobre o Edital
                    </h2>
                  </div>
                  <div className="text-slate-700 leading-relaxed space-y-3">
                    {edital.resumo.split('\n').filter(Boolean).map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Cronograma / Timeline */}
              {cronograma.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 shrink-0">
                      <IconCalendar className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 pt-1">
                      Cronograma
                    </h2>
                  </div>
                  <div className="relative">
                    <div
                      className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />

                    <ol className="space-y-1">
                      {cronograma.map((item, index) => {
                        const itemDate = new Date(item.dataHora)
                        const isPast = itemDate < now
                        const isHighlight = item.destaque === true

                        return (
                          <li key={index} className="relative pl-10">
                            <div
                              className={[
                                'absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 z-10',
                                isPast
                                  ? 'bg-brand-200 border-brand-300'
                                  : isHighlight
                                    ? 'bg-brand-600 border-brand-600 shadow-sm shadow-brand-600/30'
                                    : 'bg-white border-brand-400',
                              ].join(' ')}
                              aria-hidden="true"
                            />

                            <div
                              className={[
                                'rounded-lg p-3 transition-colors',
                                isPast
                                  ? 'opacity-60'
                                  : isHighlight
                                    ? 'bg-brand-50 border border-brand-200'
                                    : 'hover:bg-slate-50',
                              ].join(' ')}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <span
                                  className={[
                                    'font-medium',
                                    isPast ? 'text-slate-500' : 'text-slate-900',
                                    isHighlight && !isPast ? 'font-semibold' : '',
                                  ].join(' ')}
                                >
                                  {item.label}
                                </span>
                                <time
                                  dateTime={item.dataHora}
                                  className={[
                                    'text-sm font-medium tabular-nums',
                                    isPast ? 'text-slate-400' : 'text-brand-700',
                                  ].join(' ')}
                                >
                                  {formatDateTime(item.dataHora)}
                                </time>
                              </div>
                              {isPast && (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                                  <IconCheckSimple className="h-3 w-3" />
                                  Concluído
                                </span>
                              )}
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
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <IconDownload className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 pt-1">
                      Arquivos para Download
                    </h2>
                  </div>

                  {/* Layout cards para mobile */}
                  <div className="sm:hidden space-y-3">
                    {edital.arquivos.map((arquivo) => (
                      <a
                        key={arquivo.id}
                        href={arquivo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 hover:border-brand-200 transition-colors group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-brand-50 shrink-0 transition-colors">
                          <IconDownload className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {arquivo.titulo}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={getFileBadgeVariant(arquivo.tipo)} className="text-[10px]">
                              {arquivo.tipo}
                            </Badge>
                            {arquivo.acessivel && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-700 font-medium">
                                <IconAccessible className="h-3 w-3" />
                                Acessível
                              </span>
                            )}
                          </div>
                        </div>
                        <IconArrowRight className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-brand-600 transition-colors" />
                      </a>
                    ))}
                  </div>

                  {/* Layout tabela para desktop */}
                  <div className="hidden sm:block overflow-x-auto">
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
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <IconShield className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 pt-1">
                      Regras de Elegibilidade
                    </h2>
                  </div>
                  <ul className="space-y-2.5">
                    {edital.regrasElegibilidade.split('\n').filter(Boolean).map((regra, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                        <IconCheckSimple className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>{regra}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ações Afirmativas */}
              {edital.acoesAfirmativas && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 shrink-0">
                      <IconHeart className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 pt-1">
                      Ações Afirmativas
                    </h2>
                  </div>
                  <ul className="space-y-2.5">
                    {edital.acoesAfirmativas.split('\n').filter(Boolean).map((acao, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                        <IconHeart className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{acao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ do Edital */}
              {edital.faqItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
                      <IconQuestion className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 pt-1">
                      Perguntas Frequentes
                    </h2>
                  </div>
                  <FaqAccordion items={edital.faqItems} />
                </div>
              )}
            </div>

            {/* Sidebar (1/3) */}
            <aside className="lg:col-span-1">
              <div className="sticky top-6 space-y-5 sm:space-y-6">
                {/* CTA de inscrição */}
                {isOpen && (
                  <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">
                      Inscrições Abertas
                    </h3>
                    {session?.user?.role === 'PROPONENTE' ? (
                      <>
                        <p className="text-brand-100 text-sm mb-5 leading-relaxed">
                          Inscreva seu projeto cultural neste edital. Você poderá
                          salvar como rascunho e enviar quando estiver pronto.
                        </p>
                        <Button
                          href={`/proponente/inscricoes/nova?editalId=${edital.id}`}
                          variant="ghost"
                          size="lg"
                          className="w-full bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800 shadow-md font-semibold"
                        >
                          Inscrever-se
                        </Button>
                      </>
                    ) : session ? (
                      <p className="text-brand-100 text-sm leading-relaxed">
                        Apenas proponentes podem se inscrever em editais. Acesse
                        sua conta de proponente para se inscrever.
                      </p>
                    ) : (
                      <>
                        <p className="text-brand-100 text-sm mb-5 leading-relaxed">
                          Cadastre-se ou acesse sua conta para inscrever seu projeto
                          cultural neste edital.
                        </p>
                        <Button
                          href={`/login?callbackUrl=/proponente/inscricoes/nova?editalId=${edital.id}`}
                          variant="ghost"
                          size="lg"
                          className="w-full bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800 shadow-md font-semibold"
                        >
                          Inscrever-se
                        </Button>
                        <p className="mt-3 text-center text-xs text-brand-200">
                          Ainda não tem conta?{' '}
                          <Link href="/cadastro" className="underline hover:text-white">
                            Cadastre-se
                          </Link>
                        </p>
                      </>
                    )}
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
                        <Badge variant={statusDisplay.badgeVariant} dot>
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
                    {edital.arquivos.length > 0 && (
                      <div>
                        <dt className="text-slate-500">Documentos</dt>
                        <dd className="mt-0.5 font-medium text-slate-900">
                          {edital.arquivos.length} {edital.arquivos.length === 1 ? 'arquivo' : 'arquivos'} disponíveis
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
                {nextDeadline && (
                  <div className="bg-accent-50 rounded-xl border border-accent-200 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <IconClock className="h-4 w-4 text-accent-600" />
                      <h3 className="text-base font-semibold text-accent-900">
                        Próxima data
                      </h3>
                    </div>
                    <p className="text-sm text-accent-800 font-medium">
                      {nextDeadline.label}
                    </p>
                    <p className="text-sm text-accent-700 mt-1 tabular-nums">
                      {formatDateTime(nextDeadline.dataHora)}
                    </p>
                  </div>
                )}

                {/* Link para versão acessível */}
                {edital.conteudoAcessivel && (
                  <Link
                    href={`/editais/${slug}/acessivel`}
                    className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    <IconAccessible className="h-5 w-5 shrink-0" />
                    <span>Ver versão acessível deste edital</span>
                  </Link>
                )}

                {/* Link para Resultados (quando publicados) */}
                {['RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL', 'ENCERRADO'].includes(edital.status) && (
                  <div className="bg-brand-50 rounded-xl border border-brand-200 p-6">
                    <h3 className="text-base font-semibold text-brand-900 mb-2">
                      Resultados Publicados
                    </h3>
                    <p className="text-sm text-brand-700 mb-3">
                      Confira a lista de classificação deste edital.
                    </p>
                    <Link
                      href={`/editais/${slug}/resultados`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Ver Resultados
                      <IconArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}

                {/* Link de volta */}
                <Link
                  href="/editais"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <IconArrowLeft className="h-4 w-4" />
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
  // Suporta tanto array direto quanto JSON string (double-serialized)
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [] }
  }
  if (!Array.isArray(data)) return []
  return data.filter(
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

// ── FAQ Accordion (details/summary — sem JS) ─────────────────────────────────

function FaqAccordion({ items }: { items: FaqItemData[] }) {
  return (
    <div className="divide-y divide-slate-200">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-medium text-slate-900 group-open:text-brand-700 transition-colors">
              {item.pergunta}
            </span>
            <IconChevronDown className="h-5 w-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-4 text-sm text-slate-600 leading-relaxed pl-0">
            {item.resposta}
          </div>
        </details>
      ))}
    </div>
  )
}
