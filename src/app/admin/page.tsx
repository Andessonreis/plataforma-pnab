import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  Card,
  Badge,
  Button,
  StatCard,
  EmptyState,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  IconNews,
  IconClipboard,
  IconUsers,
  IconCheck,
  IconPlus,
  IconExport,
  IconInfo,
} from '@/components/ui'

export const metadata: Metadata = {
  title: 'Painel da Secretaria — Portal PNAB Irecê',
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

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
      icon: <IconNews className="h-8 w-8" />,
      href: '/admin/editais',
    },
    {
      label: 'Inscrições',
      value: totalInscricoes,
      sub: `${inscricoesEnviadas} pendente(s)`,
      color: 'bg-accent-50',
      iconColor: 'text-accent-600',
      icon: <IconClipboard className="h-8 w-8" />,
      href: '/admin/inscricoes',
    },
    {
      label: 'Proponentes',
      value: totalProponentes,
      sub: 'cadastrados',
      color: 'bg-brand-50',
      iconColor: 'text-brand-600',
      icon: <IconUsers className="h-8 w-8" />,
      href: '/admin/usuarios',
    },
    {
      label: 'Editais Abertos',
      value: editaisAbertos,
      sub: 'com inscrições abertas',
      color: 'bg-green-50',
      iconColor: 'text-green-600',
      icon: <IconCheck className="h-8 w-8" />,
      href: '/admin/editais',
    },
  ]

  return (
    <section>
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Painel da Secretaria</h1>
          <p className="text-slate-600 mt-1">
            Visão geral das atividades do Portal PNAB Irecê.
          </p>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <StatCard {...stat} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Ações rápidas */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-3 mb-8">
          <Button href="/admin/editais/novo">
            <IconPlus className="h-4 w-4 mr-2" />
            Novo Edital
          </Button>
          <Button href="/admin/inscricoes" variant="outline">
            Gerenciar Inscrições
          </Button>
          <Button href="/admin/inscricoes/export" variant="ghost">
            <IconExport className="h-4 w-4 mr-2" />
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
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <IconInfo className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">
                      <span className="font-medium">{log.user?.nome ?? 'Sistema'}</span>
                      {' — '}
                      <Badge variant="neutral">{log.action}</Badge>
                    </p>
                    {log.entity && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {log.entity} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs text-slate-500 shrink-0">
                    {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </FadeIn>
    </section>
  )
}
