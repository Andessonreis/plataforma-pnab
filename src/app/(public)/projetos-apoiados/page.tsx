import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge, PageHeader, EmptyState, FilterTabs } from '@/components/ui'
import { IconChart, IconCurrency, IconUsers, IconEye, IconCheckSimple } from '@/components/ui/icons'
import { formatCurrency } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Projetos Apoiados',
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

function getProjectName(campos: unknown): string | null {
  if (typeof campos === 'string') {
    try { campos = JSON.parse(campos) } catch { return null }
  }
  if (typeof campos === 'object' && campos !== null && 'nomeProjeto' in campos) {
    return (campos as { nomeProjeto: string }).nomeProjeto
  }
  return null
}

export default async function ProjetosApoiadosPage({ searchParams }: ProjetosApoiadosPageProps) {
  const params = await searchParams
  const selectedYear = params.ano ? parseInt(params.ano, 10) : undefined

  // Query anos disponíveis separadamente para não perder tabs ao filtrar
  const availableYears = await prisma.projetoApoiado.findMany({
    where: { publicado: true },
    select: { inscricao: { select: { edital: { select: { ano: true } } } } },
    distinct: ['inscricaoId'],
  })

  const yearSet = new Set(availableYears.map((p) => p.inscricao.edital.ano))
  let filterYears = [...yearSet].sort((a, b) => b - a)

  if (filterYears.length === 0) {
    const editaisYears = await prisma.edital.findMany({
      where: { status: { not: 'RASCUNHO' } },
      select: { ano: true },
      distinct: ['ano'],
      orderBy: { ano: 'desc' },
    })
    filterYears = editaisYears.map((e) => e.ano)
  }

  const projetos = await prisma.projetoApoiado.findMany({
    where: {
      publicado: true,
      ...(selectedYear
        ? { inscricao: { edital: { ano: selectedYear } } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      inscricao: {
        select: {
          numero: true,
          categoria: true,
          campos: true,
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

  const concluidos = projetos.filter((p) => p.statusExecucao === 'CONCLUIDO').length

  // Agrupar projetos por edital
  const grouped = new Map<string, { edital: { titulo: string; slug: string; ano: number }; projetos: typeof projetos }>()
  for (const projeto of projetos) {
    const key = projeto.inscricao.edital.slug
    if (!grouped.has(key)) {
      grouped.set(key, { edital: projeto.inscricao.edital, projetos: [] })
    }
    grouped.get(key)!.projetos.push(projeto)
  }

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

      <section className="bg-slate-50 py-6 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Estatísticas */}
          {projetos.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <StatCard
                icon={<IconUsers className="h-5 w-5 text-brand-600" />}
                label="Projetos contemplados"
                value={String(projetos.length)}
                bgColor="bg-brand-50"
              />
              <StatCard
                icon={<IconCurrency className="h-5 w-5 text-accent-600" />}
                label="Valor total investido"
                value={formatCurrency(totalValue)}
                bgColor="bg-accent-50"
                highlight
              />
              <StatCard
                icon={<IconCheckSimple className="h-5 w-5 text-emerald-600" />}
                label="Concluídos"
                value={String(concluidos)}
                bgColor="bg-emerald-50"
              />
              <StatCard
                icon={<IconChart className="h-5 w-5 text-blue-600" />}
                label="Em execução"
                value={String(projetos.length - concluidos)}
                bgColor="bg-blue-50"
              />
            </div>
          )}

          {/* Filtros */}
          {filterYears.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <FilterTabs
                tabs={yearTabs}
                activeKey={selectedYear ? String(selectedYear) : 'todos'}
                ariaLabel="Filtrar projetos por ano"
              />
              <p className="text-sm text-slate-500">
                {projetos.length} {projetos.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}
              </p>
            </div>
          )}

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
              {/* Projetos agrupados por edital */}
              <div className="space-y-10">
                {[...grouped.entries()].map(([slug, group]) => (
                  <div key={slug}>
                    {/* Header do grupo (só exibe se houver mais de 1 edital) */}
                    {grouped.size > 1 && (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 rounded-full bg-brand-500" aria-hidden="true" />
                        <div>
                          <Link
                            href={`/editais/${slug}`}
                            className="text-base font-semibold text-slate-900 hover:text-brand-700 transition-colors"
                          >
                            {group.edital.titulo}
                          </Link>
                          <p className="text-xs text-slate-500">{group.edital.ano} · {group.projetos.length} {group.projetos.length === 1 ? 'projeto' : 'projetos'}</p>
                        </div>
                      </div>
                    )}

                    {/* Tabela (desktop) */}
                    <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3.5 text-left section-label text-slate-600">
                              Projeto / Proponente
                            </th>
                            {grouped.size <= 1 && (
                              <th className="px-6 py-3.5 text-left section-label text-slate-600">
                                Edital
                              </th>
                            )}
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
                          {group.projetos.map((projeto) => {
                            const status = statusLabels[projeto.statusExecucao] ?? {
                              label: projeto.statusExecucao,
                              variant: 'neutral' as const,
                            }
                            const projectName = getProjectName(projeto.inscricao.campos)

                            return (
                              <tr key={projeto.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    {projectName && (
                                      <p className="text-sm font-semibold text-slate-900">
                                        {projectName}
                                      </p>
                                    )}
                                    <p className={`text-sm ${projectName ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                                      {projeto.inscricao.proponente.nome}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      {projeto.inscricao.numero}
                                    </p>
                                  </div>
                                </td>
                                {grouped.size <= 1 && (
                                  <td className="px-6 py-4">
                                    <Link
                                      href={`/editais/${projeto.inscricao.edital.slug}`}
                                      className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
                                    >
                                      {projeto.inscricao.edital.titulo}
                                    </Link>
                                  </td>
                                )}
                                <td className="px-6 py-4">
                                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                    {projeto.inscricao.categoria ?? '—'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">
                                  {formatCurrency(Number(projeto.valorAprovado))}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge variant={status.variant} dot>
                                    {status.label}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 max-w-[240px]">
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
                      {group.projetos.map((projeto) => {
                        const status = statusLabels[projeto.statusExecucao] ?? {
                          label: projeto.statusExecucao,
                          variant: 'neutral' as const,
                        }
                        const projectName = getProjectName(projeto.inscricao.campos)

                        return (
                          <div
                            key={projeto.id}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                          >
                            {/* Header do card */}
                            <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                {projectName ? (
                                  <p className="text-[15px] font-semibold text-slate-900 leading-snug">
                                    {projectName}
                                  </p>
                                ) : (
                                  <p className="text-[15px] font-semibold text-slate-900 leading-snug">
                                    {projeto.inscricao.proponente.nome}
                                  </p>
                                )}
                                <Badge variant={status.variant} dot>
                                  {status.label}
                                </Badge>
                              </div>
                              {projectName && (
                                <p className="text-sm text-slate-500">
                                  {projeto.inscricao.proponente.nome}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                {projeto.inscricao.numero}
                              </p>
                            </div>

                            {/* Dados do projeto */}
                            <div className="px-4 py-3 space-y-2.5 text-sm">
                              {grouped.size <= 1 && (
                                <div>
                                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Edital</p>
                                  <Link
                                    href={`/editais/${projeto.inscricao.edital.slug}`}
                                    className="text-brand-600 hover:text-brand-700 font-medium transition-colors text-sm leading-snug"
                                  >
                                    {projeto.inscricao.edital.titulo}
                                  </Link>
                                </div>
                              )}

                              <div className="flex items-center gap-4">
                                {projeto.inscricao.categoria && (
                                  <div className="flex-1">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Categoria</p>
                                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                      {projeto.inscricao.categoria}
                                    </span>
                                  </div>
                                )}
                                <div className="text-right">
                                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Valor</p>
                                  <p className="text-base font-bold text-slate-900">
                                    {formatCurrency(Number(projeto.valorAprovado))}
                                  </p>
                                </div>
                              </div>

                              {projeto.contrapartida && (
                                <div className="pt-2.5 border-t border-slate-100">
                                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Contrapartida</p>
                                  <p className="text-slate-600 leading-relaxed">
                                    {projeto.contrapartida}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Nota de transparência */}
              <div className="mt-8 sm:mt-10 bg-brand-50 rounded-xl border border-brand-200 p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 shrink-0">
                  <IconEye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-800 mb-1">
                    Transparência Pública
                  </p>
                  <p className="text-sm text-brand-700 leading-relaxed">
                    Dados publicados em atendimento ao princípio da transparência e publicidade
                    na aplicação dos recursos públicos da Política Nacional Aldir Blanc (Lei nº 14.399/2022).
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  bgColor,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bgColor: string
  highlight?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${bgColor} shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-slate-500 leading-tight">{label}</p>
          <p className={`text-sm sm:text-xl font-bold ${highlight ? 'text-brand-700' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
