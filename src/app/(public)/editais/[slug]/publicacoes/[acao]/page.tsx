import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { PageHeader, Badge } from '@client/components/ui'
import { IconArrowLeft, IconDownload, IconClock } from '@client/components/ui/icons'
import { formatDateTime } from '@shared/utils/format'
import { maskCpfCnpj, maskName } from '@shared/utils/mask'
import { getPublicacao } from '@server/lib/edital/publicacoes'
import { isAcaoPublicacao, isAcaoResultado } from '@shared/types/cronograma'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'

interface Props {
  params: Promise<{ slug: string; acao: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, acao } = await params
  if (!isAcaoPublicacao(acao)) return { title: 'Publicação não encontrada' }

  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { titulo: true },
  })
  if (!edital) return { title: 'Publicação não encontrada' }

  return { title: `Publicação — ${edital.titulo}` }
}

export default async function PublicacaoPage({ params }: Props) {
  const { slug, acao } = await params
  if (!isAcaoPublicacao(acao)) notFound()

  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { titulo: true, ano: true },
  })
  if (!edital) notFound()

  const publicacao = await getPublicacao(slug, acao)
  if (!publicacao || !publicacao.exists) notFound()

  const breadcrumbs = [
    { label: 'Início', href: '/' },
    { label: 'Editais', href: '/editais' },
    { label: edital.titulo, href: `/editais/${slug}` },
    { label: publicacao.label },
  ]

  if (!publicacao.visivel) {
    return (
      <>
        <PageHeader title={`${publicacao.label} — ${edital.titulo}`} breadcrumbs={breadcrumbs} />
        <section className="bg-slate-50 py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-600 text-lg">
                A {publicacao.label.toLowerCase()} ainda não foi publicada.
              </p>
              {publicacao.dataPublicacao && (
                <p className="text-slate-500 text-sm mt-2 inline-flex items-center gap-1.5">
                  <IconClock className="h-4 w-4" aria-hidden="true" />
                  Prevista para {formatDateTime(publicacao.dataPublicacao)}
                </p>
              )}
              <div className="mt-6">
                <Link
                  href={`/editais/${slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <IconArrowLeft className="h-4 w-4" />
                  Voltar ao edital
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  const csvUrl = `/api/editais/${slug}/publicacoes/${acao}?format=csv`

  // Lista de inscritos não expõe o status processual posterior (HABILITADA,
  // INABILITADA, etc.) — divulga apenas que a inscrição foi recebida. Status
  // só aparece nas listas de habilitados (que filtram exatamente por status).
  const exibirStatus = acao !== 'PUBLICACAO_INSCRITOS'
  const ehResultado = isAcaoResultado(acao)

  return (
    <>
      <PageHeader title={`${publicacao.label} — ${edital.titulo}`} breadcrumbs={breadcrumbs}>
        <p className="mt-2 text-brand-100 text-sm">
          {publicacao.items.length} {publicacao.items.length === 1 ? 'registro' : 'registros'} — Ano {edital.ano}
          {publicacao.dataPublicacao && (
            <> · Publicado em {formatDateTime(publicacao.dataPublicacao)}</>
          )}
        </p>
        <div className="mt-4">
          <a
            href={csvUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 min-h-[44px]"
            aria-label="Baixar lista em formato CSV"
          >
            <IconDownload className="h-5 w-5" aria-hidden="true" />
            Baixar CSV
          </a>
        </div>
      </PageHeader>

      <section className="bg-slate-50 py-6 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {publicacao.items.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-500">Nenhum registro nesta publicação.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {ehResultado && (
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Pos.</th>
                      )}
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Nº Inscrição</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Proponente</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">CPF/CNPJ</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Categoria</th>
                      {ehResultado && (
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Nota</th>
                      )}
                      {exibirStatus && (
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {publicacao.items.map((item, index) => (
                      <tr key={item.numero} className="hover:bg-slate-50 transition-colors">
                        {ehResultado && (
                          <td className="py-3 px-4 font-medium text-slate-900 tabular-nums">{item.posicao ?? index + 1}</td>
                        )}
                        <td className="py-3 px-4 font-medium text-slate-900 tabular-nums">{item.numero}</td>
                        <td className="py-3 px-4 text-slate-900">{maskName(item.nome)}</td>
                        <td className="py-3 px-4 text-slate-700 tabular-nums">{maskCpfCnpj(item.cpfCnpj)}</td>
                        <td className="py-3 px-4 text-slate-700">{item.categoria ?? '—'}</td>
                        {ehResultado && (
                          <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                            {item.notaFinal != null ? item.notaFinal.toFixed(2) : '—'}
                          </td>
                        )}
                        {exibirStatus && (
                          <td className="py-3 px-4">
                            <Badge variant={inscricaoStatusVariant[item.status]}>
                              {inscricaoStatusLabel[item.status] ?? item.status}
                            </Badge>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 bg-amber-50 rounded-xl border border-amber-200 p-5">
            <h2 className="text-sm font-semibold text-amber-900 mb-2">Sobre esta publicação</h2>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>Lista oficial referente ao marco do cronograma &ldquo;{publicacao.label}&rdquo;.</li>
              <li>Nomes e CPF/CNPJ parcialmente mascarados para proteção de dados pessoais (LGPD).</li>
              <li>Os dados refletem o estado das inscrições no momento desta requisição.</li>
            </ul>
          </div>

          <div className="mt-6">
            <Link
              href={`/editais/${slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <IconArrowLeft className="h-4 w-4" />
              Voltar ao edital
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
