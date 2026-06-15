import Link from 'next/link'
import { prisma } from '@server/lib/db'
import {
  Card,
  Badge,
  Button,
  EmptyState,
  FadeIn,
  IconNews,
  IconClipboard,
  IconUsers,
  IconCheck,
  IconPlus,
  IconExport,
  IconInfo,
} from '@client/components/ui'
import { DashboardHeader } from '../_components/DashboardHeader'
import { KpiGrid } from '../_components/KpiGrid'
import { getActionStyle } from '../page.helpers'

export async function AdminDashboard({ today }: { today: string }) {
  const [
    totalEditais,
    editaisAbertos,
    totalInscricoes,
    inscricoesEnviadas,
    totalProponentes,
    recentLogs,
  ] = await Promise.all([
    prisma.edital.count(),
    prisma.edital.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
    prisma.inscricao.count(),
    prisma.inscricao.count({ where: { status: 'ENVIADA' } }),
    prisma.user.count({ where: { role: 'PROPONENTE' } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { nome: true } } },
    }),
  ])

  const stats = [
    {
      label: 'Editais',
      value: totalEditais,
      sub: `${editaisAbertos} aberto(s)`,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      icon: <IconNews className="h-6 w-6" />,
      href: '/admin/editais',
    },
    {
      label: 'Inscrições',
      value: totalInscricoes,
      sub: `${inscricoesEnviadas} pendente(s)`,
      color: 'bg-accent-50',
      iconColor: 'text-accent-600',
      icon: <IconClipboard className="h-6 w-6" />,
      href: '/admin/inscricoes',
    },
    {
      label: 'Proponentes',
      value: totalProponentes,
      sub: 'cadastrados',
      color: 'bg-brand-50',
      iconColor: 'text-brand-600',
      icon: <IconUsers className="h-6 w-6" />,
      href: '/admin/usuarios',
    },
    {
      label: 'Editais Abertos',
      value: editaisAbertos,
      sub: 'com inscrições abertas',
      color: 'bg-green-50',
      iconColor: 'text-green-600',
      icon: <IconCheck className="h-6 w-6" />,
      href: '/admin/editais',
    },
  ]

  return (
    <section>
      <DashboardHeader
        today={today}
        title="Painel da Secretaria"
        subtitle="Visão geral das atividades do Portal PNAB Irecê."
      />

      {/* KPI Cards */}
      <KpiGrid stats={stats} />

      {/* Ações rápidas */}
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 sm:flex gap-3 mb-6 sm:mb-8">
          <Button href="/admin/editais/novo" className="text-sm sm:text-base">
            <IconPlus className="h-4 w-4 mr-1.5" />
            Novo Edital
          </Button>
          <Button href="/admin/inscricoes" variant="outline" className="text-sm sm:text-base">
            Inscrições
          </Button>
          <Button href="/admin/inscricoes/export" variant="ghost" className="col-span-2 sm:col-span-1 text-sm sm:text-base">
            <IconExport className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
        </div>
      </FadeIn>

      {/* Atividade recente */}
      <FadeIn delay={0.3}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Atividade Recente</h2>
            <Link href="/admin/logs" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Ver todos
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <EmptyState
              icon={<IconInfo className="h-8 w-8 text-slate-400" />}
              title="Nenhuma atividade registrada"
              description="As ações realizadas no sistema aparecerão aqui."
            />
          ) : (
            <div className="divide-y divide-slate-100 -mx-1 sm:mx-0">
              {recentLogs.map((log) => {
                const actionStyle = getActionStyle(log.action)
                return (
                  <div key={log.id} className="flex items-start gap-2.5 sm:gap-3 px-1 sm:px-3 py-2.5 sm:py-3.5 hover:bg-slate-50/50 transition-colors first:pt-0 last:pb-0">
                    <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${actionStyle.bg}`}>
                      <actionStyle.Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${actionStyle.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs sm:text-sm text-slate-800 truncate">
                          <span className="font-medium">{log.user?.nome?.split(' ').slice(0, 2).join(' ') ?? 'Sistema'}</span>
                        </p>
                        <span className="text-[10px] sm:text-xs text-slate-400 shrink-0 tabular-nums">
                          {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'America/Sao_Paulo',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant={actionStyle.badge}>{log.action.replace(/_/g, ' ')}</Badge>
                        {log.entity && (
                          <span className="text-[10px] sm:text-xs text-slate-400 truncate">
                            {log.entity} #{log.entityId?.slice(0, 6)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </FadeIn>
    </section>
  )
}
