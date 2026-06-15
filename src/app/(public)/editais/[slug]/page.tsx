import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { editaisRepository } from '@server/modules/editais/repository/editais.repository'
import { auth } from '@server/lib/auth'
import { Badge, PageHeader } from '@client/components/ui'
import {
  IconDownload,
  IconCheckSimple,
  IconShield,
  IconHeart,
  IconCalendar,
  IconClock,
  IconCurrency,
  IconDocument,
  IconQuestion,
} from '@client/components/ui/icons'
import { getPublicStatusDisplay } from '@client/utils/edital-status-ui'
import { formatCurrency, formatDate } from '@shared/utils/format'
import { parseCronogramaPublico, getNextDeadline } from '@shared/utils/cronograma'
import { CronogramaTimeline } from './_components/CronogramaTimeline'
import { ArquivosDownload } from './_components/ArquivosDownload'
import { EditalSidebar } from './_components/EditalSidebar'
import { FaqAccordion } from './_components/FaqAccordion'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const edital = await editaisRepository.findMetadataBySlug(slug)

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

  const edital = await editaisRepository.findBySlugWithRelations(slug)

  if (!edital || (!isAdmin && edital.status === 'RASCUNHO')) {
    notFound()
  }

  // Mapa tipo→label para exibir labels humanos nos badges de arquivo
  const tipoLabels: Record<string, string> = {}
  if (edital.arquivos.length > 0) {
    const tiposUsados = [...new Set(edital.arquivos.map((a) => a.tipo))]
    const attachmentTypes = await prisma.attachmentType.findMany({
      where: { tipo: { in: tiposUsados } },
      select: { tipo: true, label: true },
    })
    for (const at of attachmentTypes) {
      tipoLabels[at.tipo] = at.label
    }
  }

  const cronograma = parseCronogramaPublico(edital.cronograma, edital.status, edital.publishedAt)
  const now = new Date()
  const statusDisplay = getPublicStatusDisplay(cronograma, edital.status, now)
  const isOpen = edital.status === 'INSCRICOES_ABERTAS'

  const nextDeadline = getNextDeadline(edital.cronograma)

  // PDF oficial do edital em destaque (botão "Baixar Edital Completo").
  // Prioriza tipo PDF_EDITAL; se não houver, cai pro primeiro arquivo do tipo PDF.
  const editalPdf =
    edital.arquivos.find((a) => a.tipo === 'PDF_EDITAL') ??
    edital.arquivos.find((a) => a.tipo === 'PDF')

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
          {(edital.vagasContemplados || edital.vagasSuplentes) && (
            <span className="inline-flex items-center gap-2">
              <IconCheckSimple className="h-4 w-4 text-brand-200" />
              <span className="font-medium text-white">
                {edital.vagasContemplados ?? 0} contemplado{edital.vagasContemplados !== 1 ? 's' : ''}
                {edital.vagasSuplentes ? ` + ${edital.vagasSuplentes} suplente${edital.vagasSuplentes !== 1 ? 's' : ''}` : ''}
              </span>
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

        {/* Botão de destaque: Baixar Edital Completo */}
        {editalPdf && (
          <div className="mt-4 sm:mt-5">
            <a
              href={editalPdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 px-4 py-2.5 text-sm sm:text-base font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 min-h-[44px]"
              aria-label="Baixar o edital completo em PDF"
            >
              <IconDownload className="h-5 w-5" aria-hidden="true" />
              Baixar Edital Completo (PDF)
            </a>
          </div>
        )}
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
                  <CronogramaTimeline cronograma={cronograma} slug={slug} now={now} />
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

                  <ArquivosDownload arquivos={edital.arquivos} tipoLabels={tipoLabels} />
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
            <EditalSidebar
              edital={edital}
              session={session}
              statusDisplay={statusDisplay}
              nextDeadline={nextDeadline}
              slug={slug}
              isOpen={isOpen}
            />
          </div>
        </div>
      </section>
    </>
  )
}
