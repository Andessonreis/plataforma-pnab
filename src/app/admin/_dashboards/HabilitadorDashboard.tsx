import Link from 'next/link'
import { prisma } from '@server/lib/db'
import {
  Card,
  Button,
  EmptyState,
  FadeIn,
  IconNews,
  IconClipboard,
  IconCheck,
  IconInfo,
} from '@client/components/ui'
import { DashboardHeader } from '../_components/DashboardHeader'
import { KpiGrid } from '../_components/KpiGrid'

export async function HabilitadorDashboard({ today }: { today: string }) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    pendentes,
    habilitadasHoje,
    inabilitadasHoje,
    totalHabilitadas,
    totalInabilitadas,
    inscricoesPendentes,
    editaisEmHabilitacao,
  ] = await Promise.all([
    prisma.inscricao.count({ where: { status: 'ENVIADA' } }),
    prisma.inscricao.count({ where: { status: 'HABILITADA', updatedAt: { gte: startOfToday } } }),
    prisma.inscricao.count({ where: { status: 'INABILITADA', updatedAt: { gte: startOfToday } } }),
    prisma.inscricao.count({ where: { status: 'HABILITADA' } }),
    prisma.inscricao.count({ where: { status: 'INABILITADA' } }),
    prisma.inscricao.findMany({
      where: { status: 'ENVIADA' },
      orderBy: { submittedAt: 'asc' },
      take: 10,
      include: {
        edital: { select: { titulo: true, ano: true } },
        proponente: { select: { nome: true, cpfCnpj: true } },
      },
    }),
    prisma.edital.count({ where: { status: 'HABILITACAO' } }),
  ])

  const stats = [
    {
      label: 'Aguardando',
      value: pendentes,
      sub: 'para analisar',
      color: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: <IconClipboard className="h-6 w-6" />,
      href: '/admin/inscricoes?status=ENVIADA',
    },
    {
      label: 'Habilitadas Hoje',
      value: habilitadasHoje,
      sub: 'aprovadas',
      color: 'bg-green-50',
      iconColor: 'text-green-600',
      icon: <IconCheck className="h-6 w-6" />,
      href: '/admin/inscricoes?status=HABILITADA',
    },
    {
      label: 'Inabilitadas Hoje',
      value: inabilitadasHoje,
      sub: 'com restrição',
      color: 'bg-red-50',
      iconColor: 'text-red-600',
      icon: <IconInfo className="h-6 w-6" />,
      href: '/admin/inscricoes?status=INABILITADA',
    },
    {
      label: 'Editais em Triagem',
      value: editaisEmHabilitacao,
      sub: 'em fase de habilitação',
      color: 'bg-brand-50',
      iconColor: 'text-brand-600',
      icon: <IconNews className="h-6 w-6" />,
      href: '/admin/inscricoes',
    },
  ]

  return (
    <section>
      <DashboardHeader
        today={today}
        title="Triagem Documental"
        subtitle="Análise e habilitação de inscrições submetidas."
      />

      {/* KPI Cards */}
      <KpiGrid stats={stats} />

      {/* Ações rápidas */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
          <Button href="/admin/inscricoes?status=ENVIADA">
            <IconClipboard className="h-4 w-4 mr-1.5" />
            Fila de Análise ({pendentes})
          </Button>
          <Button href="/admin/inscricoes?status=HABILITADA" variant="outline" size="sm">
            Habilitadas ({totalHabilitadas})
          </Button>
          <Button href="/admin/inscricoes?status=INABILITADA" variant="ghost" size="sm">
            Inabilitadas ({totalInabilitadas})
          </Button>
        </div>
      </FadeIn>

      {/* Inscrições pendentes */}
      <FadeIn delay={0.3}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Fila de Análise
            </h2>
            <Link
              href="/admin/inscricoes?status=ENVIADA"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Ver todas
            </Link>
          </div>

          {inscricoesPendentes.length === 0 ? (
            <EmptyState
              icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
              title="Nenhuma inscrição pendente"
              description="Todas as inscrições foram analisadas."
            />
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="sm:hidden divide-y divide-slate-100 -mx-4">
                {inscricoesPendentes.map((ins) => (
                  <Link
                    key={ins.id}
                    href={`/admin/inscricoes/${ins.id}`}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                      <IconClipboard className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{ins.proponente.nome}</p>
                      <p className="text-xs text-slate-500 truncate mb-0.5">{ins.edital.titulo}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">{ins.numero}</span>
                        {ins.categoria && (
                          <span className="text-[11px] text-slate-400">· {ins.categoria}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 tabular-nums mt-1">
                      {ins.submittedAt
                        ? new Date(ins.submittedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            timeZone: 'America/Sao_Paulo',
                          })
                        : '—'}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Desktop: tabela */}
              <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2.5 px-4 sm:px-6 font-medium text-slate-500 text-xs uppercase tracking-wide">Nº Inscrição</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Proponente</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Edital</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Categoria</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Enviada em</th>
                      <th className="py-2.5 px-4 sm:px-6" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inscricoesPendentes.map((ins) => (
                      <tr key={ins.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 sm:px-6 font-mono text-xs text-slate-600">{ins.numero}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{ins.proponente.nome}</p>
                          <p className="text-xs text-slate-400">{ins.proponente.cpfCnpj}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[200px]">
                          <p className="truncate">{ins.edital.titulo}</p>
                          <p className="text-xs text-slate-400">{ins.edital.ano}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{ins.categoria ?? '—'}</td>
                        <td className="py-3 px-4 text-slate-500 tabular-nums text-xs">
                          {ins.submittedAt
                            ? new Date(ins.submittedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                timeZone: 'America/Sao_Paulo',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <Link
                            href={`/admin/inscricoes/${ins.id}`}
                            className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                          >
                            Analisar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pendentes > 10 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Link
                    href="/admin/inscricoes?status=ENVIADA"
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Ver todas as {pendentes} inscrições pendentes →
                  </Link>
                </div>
              )}
            </>
          )}
        </Card>
      </FadeIn>
    </section>
  )
}
