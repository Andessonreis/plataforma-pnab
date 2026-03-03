import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge, Button, PageHeader, EmptyState, FilterTabs } from '@/components/ui'
import { IconChart } from '@/components/ui/icons'
import { formatCurrency } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Projetos Apoiados — Portal PNAB Irecê',
  description:
    'Consulte os projetos culturais apoiados pela Política Nacional Aldir Blanc em Irecê. Transparência com valores, status e contrapartidas.',
}

interface ProjetosApoiadosPageProps {
  searchParams: Promise<{ ano?: string }>
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
  EM_EXECUCAO: { label: 'Em execução', variant: 'info' },
  CONCLUIDO: { label: 'Concluído', variant: 'success' },
  PRESTACAO_CONTAS: { label: 'Prestação de contas', variant: 'warning' },
  CANCELADO: { label: 'Cancelado', variant: 'neutral' },
}

export default async function ProjetosApoiadosPage({ searchParams }: ProjetosApoiadosPageProps) {
  const params = await searchParams
  const selectedYear = params.ano ? parseInt(params.ano, 10) : undefined

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

  const totalValue = projetos.reduce(
    (sum, p) => sum + Number(p.valorAprovado),
    0,
  )

  const allYears = [...new Set(projetos.map((p) => p.inscricao.edital.ano))].sort(
    (a, b) => b - a,
  )

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

  // Monta tabs de filtro por ano
  const yearTabs = [
    { key: 'todos', label: 'Todos', href: '/projetos-apoiados' },
    ...filterYears.map((year) => ({
      key: String(year),
      label: String(year),
      href: `/projetos-apoiados?ano=${year}`,
    })),
  ]

  return (
    <>
      <PageHeader
        title="Projetos Apoiados"
        subtitle="Transparência na aplicação dos recursos da PNAB. Consulte os projetos culturais contemplados em Irecê."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Projetos Apoiados' },
        ]}
      />

      {/* Conteúdo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Resumo + Filtro */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
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

            {filterYears.length > 0 && (
              <FilterTabs
                tabs={yearTabs}
                activeKey={selectedYear ? String(selectedYear) : 'todos'}
                ariaLabel="Filtrar projetos por ano"
              />
            )}
          </div>

          {projetos.length === 0 ? (
            <EmptyState
              icon={<IconChart className="h-8 w-8 text-slate-400" />}
              title="Nenhum projeto publicado ainda"
              description={
                selectedYear
                  ? `Nenhum projeto encontrado para o ano ${selectedYear}. Tente selecionar outro ano.`
                  : 'Os projetos apoiados serão publicados aqui após a conclusão dos processos de seleção.'
              }
              action={selectedYear ? { label: 'Ver todos os anos', href: '/projetos-apoiados' } : undefined}
            />
          ) : (
            <>
              {/* Tabela (desktop) */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3.5 text-left section-label text-slate-600">
                        Proponente
                      </th>
                      <th className="px-6 py-3.5 text-left section-label text-slate-600">
                        Edital
                      </th>
                      <th className="px-6 py-3.5 text-left section-label text-slate-600">
                        Categoria
                      </th>
                      <th className="px-6 py-3.5 text-right section-label text-slate-600">
                        Valor Aprovado
                      </th>
                      <th className="px-6 py-3.5 text-left section-label text-slate-600">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left section-label text-slate-600">
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
                            <Badge variant={status.variant} dot>
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
                        <Badge variant={status.variant} dot>
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

              {/* Nota de transparência */}
              <div className="mt-8 bg-brand-50 rounded-xl border border-brand-200 p-6 text-center">
                <p className="text-sm text-brand-700">
                  Dados publicados em atendimento ao princípio da transparência e publicidade
                  na aplicação dos recursos públicos da Política Nacional Aldir Blanc.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
