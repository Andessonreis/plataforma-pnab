import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PageHeader, Badge } from '@/components/ui'
import { IconArrowLeft } from '@/components/ui/icons'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { titulo: true },
  })

  return {
    title: edital ? `Resultados — ${edital.titulo}` : 'Resultados',
  }
}

export default async function PublicResultadosPage({ params }: Props) {
  const { slug } = await params

  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: {
      id: true,
      titulo: true,
      ano: true,
      status: true,
    },
  })

  if (!edital) notFound()

  // Só mostra resultados se o edital estiver em fase de resultado
  const showResults = [
    'RESULTADO_PRELIMINAR',
    'RECURSO',
    'RESULTADO_FINAL',
    'ENCERRADO',
  ].includes(edital.status)

  if (!showResults) {
    return (
      <>
        <PageHeader
          title={`Resultados — ${edital.titulo}`}
          breadcrumbs={[
            { label: 'Início', href: '/' },
            { label: 'Editais', href: '/editais' },
            { label: edital.titulo, href: `/editais/${slug}` },
            { label: 'Resultados' },
          ]}
        />
        <section className="bg-slate-50 py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-600 text-lg">
                Os resultados deste edital ainda não foram publicados.
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Acompanhe o cronograma do edital para saber quando os resultados serão divulgados.
              </p>
              <Link
                href={`/editais/${slug}`}
                className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-brand-600 hover:text-brand-700"
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

  const isFinal = ['RESULTADO_FINAL', 'ENCERRADO'].includes(edital.status)
  const faseLabel = isFinal ? 'Resultado Final' : 'Resultado Preliminar'

  // Busca inscrições com nota
  const inscricoes = await prisma.inscricao.findMany({
    where: {
      editalId: edital.id,
      status: {
        in: [
          'RESULTADO_PRELIMINAR',
          'RESULTADO_FINAL',
          'CONTEMPLADA',
          'NAO_CONTEMPLADA',
          'SUPLENTE',
          'RECURSO_ABERTO',
        ],
      },
    },
    include: {
      proponente: { select: { nome: true } },
    },
    orderBy: { notaFinal: 'desc' },
  })

  return (
    <>
      <PageHeader
        title={`${faseLabel} — ${edital.titulo}`}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Editais', href: '/editais' },
          { label: edital.titulo, href: `/editais/${slug}` },
          { label: 'Resultados' },
        ]}
      >
        <p className="mt-2 text-brand-100 text-sm">
          {inscricoes.length} inscrições classificadas — Ano {edital.ano}
        </p>
      </PageHeader>

      <section className="bg-slate-50 py-6 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {inscricoes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-500">Nenhum resultado disponível.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Pos.</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Proponente</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Categoria</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Nota</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inscricoes.map((inscricao, index) => (
                      <tr key={inscricao.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 text-slate-900">
                          {maskName(inscricao.proponente.nome)}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {inscricao.categoria ?? '—'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {inscricao.notaFinal ? Number(inscricao.notaFinal).toFixed(2) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getPublicStatusVariant(inscricao.status)}>
                            {getPublicStatusLabel(inscricao.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Informações importantes */}
          <div className="mt-6 bg-amber-50 rounded-xl border border-amber-200 p-5">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Informações importantes</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              {!isFinal && (
                <li>Este é o resultado <strong>preliminar</strong>. Cabe recurso conforme cronograma do edital.</li>
              )}
              <li>Nomes parcialmente mascarados para proteção de dados pessoais (LGPD).</li>
              <li>Para dúvidas, entre em contato pelo formulário na página de contato.</li>
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

function maskName(name: string): string {
  const parts = name.split(' ')
  if (parts.length <= 1) return name
  return `${parts[0]} ${'***'} ${parts[parts.length - 1]}`
}

function getPublicStatusLabel(status: string): string {
  const map: Record<string, string> = {
    RESULTADO_PRELIMINAR: 'Classificado(a)',
    RESULTADO_FINAL: 'Classificado(a)',
    CONTEMPLADA: 'Contemplado(a)',
    NAO_CONTEMPLADA: 'Não Contemplado(a)',
    SUPLENTE: 'Suplente',
    RECURSO_ABERTO: 'Em Recurso',
  }
  return map[status] ?? status
}

function getPublicStatusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'neutral'> = {
    RESULTADO_PRELIMINAR: 'info',
    RESULTADO_FINAL: 'info',
    CONTEMPLADA: 'success',
    NAO_CONTEMPLADA: 'error',
    SUPLENTE: 'warning',
    RECURSO_ABERTO: 'warning',
  }
  return map[status] ?? 'neutral'
}
