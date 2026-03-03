import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Projetos Apoiados — Portal PNAB Irece',
  description:
    'Consulte os projetos culturais apoiados pela Politica Nacional Aldir Blanc em Irece. Transparencia com valores, status e contrapartidas.',
}

interface ProjetosApoiadosPageProps {
  searchParams: Promise<{ ano?: string }>
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
  EM_EXECUCAO: { label: 'Em execucao', variant: 'info' },
  CONCLUIDO: { label: 'Concluido', variant: 'success' },
  PRESTACAO_CONTAS: { label: 'Prestacao de contas', variant: 'warning' },
  CANCELADO: { label: 'Cancelado', variant: 'neutral' },
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default async function ProjetosApoiadosPage({ searchParams }: ProjetosApoiadosPageProps) {
  const params = await searchParams
  const selectedYear = params.ano ? parseInt(params.ano, 10) : undefined

  // Busca projetos publicados
  const projetos = await prisma.projetoApoiado.findMany({
    where: {
      publicado: true,
      ...(selectedYear
        ? {
            inscricao: {
              edital: {
                ano: selectedYear,
              },
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      inscricao: {
        select: {
          numero: true,
          categoria: true,
          edital: {
            select: {
              titulo: true,
              slug: true,
              ano: true,
            },
          },
          proponente: {
            select: {
              nome: true,
              tipoProponente: true,
            },
          },
        },
      },
    },
  })

  // Calcula valor total
  const totalValue = projetos.reduce(
    (sum, p) => sum + Number(p.valorAprovado),
    0,
  )

  // Anos disponiveis para filtro
  const allYears = [...new Set(projetos.map((p) => p.inscricao.edital.ano))].sort(
    (a, b) => b - a,
  )

  // Se nao ha projetos e nenhum ano no DB, busca anos dos editais para o filtro
  let filterYears = allYears
  if (filterYears.length === 0) {
    const editaisYears = await prisma.edital.findMany({
      where: { status: { not: 'RASCUNHO' } },
      select: { ano: true },
      distinct: ['ano'],
      orderBy: { ano: 'desc' },
    })
    filterYears = editaisYears.map((e) => e.ano)
  }

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <nav className="mb-4 text-sm text-brand-200" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium">Projetos Apoiados</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Projetos Apoiados
          </h1>
          <p className="mt-3 text-lg text-brand-100 max-w-2xl">
            Transparencia na aplicacao dos recursos da PNAB. Consulte os projetos
            culturais contemplados em Irece.
          </p>
        </div>
      </section>

      {/* Conteudo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Resumo + Filtro */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            {/* Resumo */}
            {projetos.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex items-center gap-6">
                <div>
                  <p className="text-sm text-slate-500">Total de projetos</p>
                  <p className="text-2xl font-bold text-slate-900">{projetos.length}</p>
                </div>
                <div className="h-10 w-px bg-slate-200" aria-hidden="true" />
                <div>
                  <p className="text-sm text-slate-500">Valor total investido</p>
                  <p className="text-2xl font-bold text-brand-700">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            )}

            {/* Filtro por ano */}
            {filterYears.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Filtrar por ano:</span>
                <div className="flex gap-1.5">
                  <Link
                    href="/projetos-apoiados"
                    className={[
                      'inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors min-h-[44px]',
                      !selectedYear
                        ? 'bg-brand-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    Todos
                  </Link>
                  {filterYears.map((year) => (
                    <Link
                      key={year}
                      href={`/projetos-apoiados?ano=${year}`}
                      className={[
                        'inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors min-h-[44px]',
                        selectedYear === year
                          ? 'bg-brand-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {year}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {projetos.length === 0 ? (
            /* Estado vazio */
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Nenhum projeto publicado ainda
              </h2>
              <p className="mt-2 text-slate-600 max-w-md mx-auto">
                {selectedYear
                  ? `Nenhum projeto encontrado para o ano ${selectedYear}. Tente selecionar outro ano.`
                  : 'Os projetos apoiados serao publicados aqui apos a conclusao dos processos de selecao.'}
              </p>
              {selectedYear && (
                <Link
                  href="/projetos-apoiados"
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 transition-colors min-h-[44px]"
                >
                  Ver todos os anos
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Tabela (desktop) */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Proponente
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Edital
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Valor Aprovado
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Contrapartida
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projetos.map((projeto) => {
                      const status = statusLabels[projeto.statusExecucao] ?? {
                        label: projeto.statusExecucao,
                        variant: 'neutral' as const,
                      }

                      return (
                        <tr key={projeto.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {projeto.inscricao.proponente.nome}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {projeto.inscricao.numero}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/editais/${projeto.inscricao.edital.slug}`}
                              className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
                            >
                              {projeto.inscricao.edital.titulo}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {projeto.inscricao.categoria ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">
                            {formatCurrency(Number(projeto.valorAprovado))}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                            {projeto.contrapartida ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-4">
                {projetos.map((projeto) => {
                  const status = statusLabels[projeto.statusExecucao] ?? {
                    label: projeto.statusExecucao,
                    variant: 'neutral' as const,
                  }

                  return (
                    <div
                      key={projeto.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {projeto.inscricao.proponente.nome}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {projeto.inscricao.numero}
                          </p>
                        </div>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Edital</span>
                          <Link
                            href={`/editais/${projeto.inscricao.edital.slug}`}
                            className="text-brand-600 hover:text-brand-700 font-medium transition-colors text-right"
                          >
                            {projeto.inscricao.edital.titulo}
                          </Link>
                        </div>
                        {projeto.inscricao.categoria && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Categoria</span>
                            <span className="text-slate-900">{projeto.inscricao.categoria}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-500">Valor aprovado</span>
                          <span className="text-slate-900 font-semibold">
                            {formatCurrency(Number(projeto.valorAprovado))}
                          </span>
                        </div>
                        {projeto.contrapartida && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Contrapartida</span>
                            <span className="text-slate-600 text-right max-w-[60%]">
                              {projeto.contrapartida}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Nota de transparencia */}
              <div className="mt-8 bg-brand-50 rounded-xl border border-brand-200 p-6 text-center">
                <p className="text-sm text-brand-700">
                  Dados publicados em atendimento ao principio da transparencia e publicidade
                  na aplicacao dos recursos publicos da Politica Nacional Aldir Blanc.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
