import Link from 'next/link'
import type { Session } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import {
  Card,
  Badge,
  Button,
  EmptyState,
  FadeIn,
  IconClipboard,
  IconCheck,
  IconClock,
  IconStar,
  IconChart,
} from '@client/components/ui'
import { DashboardHeader } from '../_components/DashboardHeader'
import { KpiGrid } from '../_components/KpiGrid'

export async function AvaliadorDashboard({ today, session }: { today: string; session: NonNullable<Session> }) {
  const userId = session.user.id
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    pendentes,
    concluidas,
    concluidasHoje,
    avaliacoesRecentes,
  ] = await Promise.all([
    prisma.avaliacao.count({
      where: { avaliadorId: userId, finalizada: false },
    }),
    prisma.avaliacao.count({
      where: { avaliadorId: userId, finalizada: true },
    }),
    prisma.avaliacao.count({
      where: { avaliadorId: userId, finalizada: true, updatedAt: { gte: startOfToday } },
    }),
    prisma.avaliacao.findMany({
      where: { avaliadorId: userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        inscricao: {
          select: {
            numero: true,
            categoria: true,
            proponente: { select: { nome: true } },
            edital: { select: { titulo: true, ano: true } },
          },
        },
      },
    }),
  ])

  const total = pendentes + concluidas

  const stats = [
    {
      label: 'Pendentes',
      value: pendentes,
      sub: 'para avaliar',
      color: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: <IconClipboard className="h-6 w-6" />,
      href: '/admin/inscricoes',
    },
    {
      label: 'Concluídas',
      value: concluidas,
      sub: 'avaliações feitas',
      color: 'bg-green-50',
      iconColor: 'text-green-600',
      icon: <IconCheck className="h-6 w-6" />,
      href: '/admin/inscricoes',
    },
    {
      label: 'Hoje',
      value: concluidasHoje,
      sub: 'avaliadas hoje',
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      icon: <IconStar className="h-6 w-6" />,
      href: '/admin/inscricoes',
    },
    {
      label: 'Total Atribuídas',
      value: total,
      sub: 'inscrições designadas',
      color: 'bg-brand-50',
      iconColor: 'text-brand-600',
      icon: <IconChart className="h-6 w-6" />,
      href: '/admin/inscricoes',
    },
  ]

  return (
    <section>
      <DashboardHeader
        today={today}
        title="Painel de Avaliação"
        subtitle="Suas avaliações atribuídas e progresso de análise."
      />

      {/* KPI Cards */}
      <KpiGrid stats={stats} />

      {/* Ações rápidas */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
          <Button href="/admin/inscricoes" size="sm">
            <IconClipboard className="h-4 w-4 mr-1.5" />
            Minhas Avaliações
          </Button>
          {pendentes > 0 && (
            <Button href="/admin/inscricoes" variant="outline" size="sm">
              <IconClock className="h-4 w-4 mr-1.5" />
              Pendentes ({pendentes})
            </Button>
          )}
        </div>
      </FadeIn>

      {/* Lista de avaliações recentes */}
      <FadeIn delay={0.3}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Avaliações Recentes
            </h2>
            <Link
              href="/admin/inscricoes"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Ver todas
            </Link>
          </div>

          {avaliacoesRecentes.length === 0 ? (
            <EmptyState
              icon={<IconStar className="h-8 w-8 text-slate-400" />}
              title="Nenhuma avaliação atribuída"
              description="Você receberá notificação quando novas inscrições forem designadas para avaliação."
            />
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="sm:hidden divide-y divide-slate-100 -mx-4">
                {avaliacoesRecentes.map((av) => {
                  const isPending = !av.finalizada
                  return (
                    <Link
                      key={av.id}
                      href={`/admin/inscricoes/${av.inscricaoId}`}
                      className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isPending ? 'bg-amber-50' : 'bg-green-50'}`}>
                        {isPending
                          ? <IconClipboard className="h-4 w-4 text-amber-600" />
                          : <IconCheck className="h-4 w-4 text-green-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {av.inscricao.proponente.nome}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{av.inscricao.edital.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-400">{av.inscricao.numero}</span>
                          <Badge variant={isPending ? 'warning' : 'success'}>
                            {isPending ? 'Pendente' : `Nota: ${av.notaTotal}`}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )
                })}
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
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Status</th>
                      <th className="py-2.5 px-4 sm:px-6" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {avaliacoesRecentes.map((av) => {
                      const isPending = !av.finalizada
                      return (
                        <tr key={av.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 sm:px-6 font-mono text-xs text-slate-600">{av.inscricao.numero}</td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{av.inscricao.proponente.nome}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-[200px]">
                            <p className="truncate">{av.inscricao.edital.titulo}</p>
                            <p className="text-xs text-slate-400">{av.inscricao.edital.ano}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{av.inscricao.categoria ?? '—'}</td>
                          <td className="py-3 px-4">
                            <Badge variant={isPending ? 'warning' : 'success'}>
                              {isPending ? 'Pendente' : `Nota: ${av.notaTotal}`}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-right">
                            <Link
                              href={`/admin/inscricoes/${av.inscricaoId}`}
                              className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                            >
                              {isPending ? 'Avaliar' : 'Ver'}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {total > 10 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Link
                    href="/admin/inscricoes"
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Ver todas as {total} avaliações →
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
