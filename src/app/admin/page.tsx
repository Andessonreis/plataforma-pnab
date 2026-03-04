import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import type { UserRole } from '@prisma/client'
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
  IconUser,
  IconTicket,
  IconQuestion,
  IconChatBubble,
  IconClock,
} from '@/components/ui'

export const metadata: Metadata = {
  title: 'Painel Administrativo — Portal PNAB Irecê',
}

type IconComponent = React.ComponentType<{ className?: string }>
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

function getActionStyle(action: string): { Icon: IconComponent; bg: string; color: string; badge: BadgeVariant } {
  if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('CADASTRO')) {
    return { Icon: IconUser, bg: 'bg-blue-50', color: 'text-blue-600', badge: 'info' }
  }
  if (action.includes('INSCRICAO') || action.includes('ENVIADA')) {
    return { Icon: IconClipboard, bg: 'bg-amber-50', color: 'text-amber-600', badge: 'warning' }
  }
  if (action.includes('EDITAL') || action.includes('PUBLICADO')) {
    return { Icon: IconNews, bg: 'bg-green-50', color: 'text-green-600', badge: 'success' }
  }
  if (action.includes('STATUS') || action.includes('ALTERADO')) {
    return { Icon: IconCheck, bg: 'bg-purple-50', color: 'text-purple-600', badge: 'neutral' }
  }
  return { Icon: IconInfo, bg: 'bg-slate-100', color: 'text-slate-500', badge: 'neutral' }
}

function ticketStatusBadge(status: string): BadgeVariant {
  if (status === 'ABERTO') return 'warning'
  if (status === 'EM_ATENDIMENTO') return 'info'
  if (status === 'FECHADO') return 'success'
  return 'neutral'
}

function ticketStatusLabel(status: string) {
  if (status === 'ABERTO') return 'Aberto'
  if (status === 'EM_ATENDIMENTO') return 'Em Atendimento'
  if (status === 'FECHADO') return 'Fechado'
  return status
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = session.user.role as UserRole

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // ─── Dashboard ATENDIMENTO ───────────────────────────────────────────────
  if (role === 'ATENDIMENTO') {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [ticketsAbertos, ticketsEmAtendimento, ticketsFechadosHoje, totalFaq, ticketsRecentes] =
      await Promise.all([
        prisma.ticket.count({ where: { status: 'ABERTO' } }),
        prisma.ticket.count({ where: { status: 'EM_ATENDIMENTO' } }),
        prisma.ticket.count({ where: { status: 'FECHADO', updatedAt: { gte: startOfToday } } }),
        prisma.faqItem.count({ where: { publicado: true } }),
        prisma.ticket.findMany({
          where: { status: { in: ['ABERTO', 'EM_ATENDIMENTO'] } },
          orderBy: { createdAt: 'asc' },
          take: 8,
        }),
      ])

    const stats = [
      {
        label: 'Aguardando',
        value: ticketsAbertos,
        sub: 'tickets abertos',
        color: 'bg-amber-50',
        iconColor: 'text-amber-600',
        icon: <IconTicket className="h-6 w-6" />,
        href: '/admin/tickets?status=ABERTO',
      },
      {
        label: 'Em Andamento',
        value: ticketsEmAtendimento,
        sub: 'em atendimento',
        color: 'bg-blue-50',
        iconColor: 'text-blue-600',
        icon: <IconChatBubble className="h-6 w-6" />,
        href: '/admin/tickets?status=EM_ATENDIMENTO',
      },
      {
        label: 'Fechados Hoje',
        value: ticketsFechadosHoje,
        sub: 'resolvidos hoje',
        color: 'bg-green-50',
        iconColor: 'text-green-600',
        icon: <IconCheck className="h-6 w-6" />,
        href: '/admin/tickets?status=FECHADO',
      },
      {
        label: 'FAQ Publicados',
        value: totalFaq,
        sub: 'itens ativos',
        color: 'bg-brand-50',
        iconColor: 'text-brand-600',
        icon: <IconQuestion className="h-6 w-6" />,
        href: '/admin/faq',
      },
    ]

    return (
      <section>
        <FadeIn>
          <div className="mb-6 sm:mb-8">
            <p className="text-sm text-slate-500 capitalize mb-1">{today}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Central de Atendimento</h1>
            <p className="text-sm text-slate-500 mt-1">
              Tickets pendentes e base de conhecimento do portal.
            </p>
          </div>
        </FadeIn>

        {/* KPI Cards */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <StatCard {...stat} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Ações rápidas */}
        <FadeIn delay={0.2}>
          <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
            <Button href="/admin/tickets" size="sm">
              <IconTicket className="h-4 w-4 mr-1.5" />
              Ver Tickets
            </Button>
            <Button href="/admin/tickets?status=ABERTO" variant="outline" size="sm">
              <IconClock className="h-4 w-4 mr-1.5" />
              Pendentes ({ticketsAbertos})
            </Button>
            <Button href="/admin/faq" variant="ghost" size="sm">
              <IconQuestion className="h-4 w-4 mr-1.5" />
              Gerenciar FAQ
            </Button>
          </div>
        </FadeIn>

        {/* Tickets pendentes */}
        <FadeIn delay={0.3}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Tickets Pendentes
              </h2>
              <Link
                href="/admin/tickets"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Ver todos
              </Link>
            </div>

            {ticketsRecentes.length === 0 ? (
              <EmptyState
                icon={<IconTicket className="h-8 w-8 text-slate-400" />}
                title="Nenhum ticket pendente"
                description="Todos os atendimentos estão em dia."
              />
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="sm:hidden divide-y divide-slate-100 -mx-4">
                  {ticketsRecentes.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/admin/tickets/${ticket.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                        <IconTicket className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-mono text-slate-400">{ticket.protocolo}</p>
                          <Badge variant={ticketStatusBadge(ticket.status)}>
                            {ticketStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">{ticket.assunto}</p>
                        <p className="text-xs text-slate-500 truncate">{ticket.nomeContato}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 tabular-nums mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Desktop: lista */}
                <div className="hidden sm:block divide-y divide-slate-100">
                  {ticketsRecentes.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/admin/tickets/${ticket.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-slate-50/50 transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <IconTicket className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{ticket.assunto}</p>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {ticket.nomeContato} · {ticket.emailContato}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={ticketStatusBadge(ticket.status)}>
                          {ticketStatusLabel(ticket.status)}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">{ticket.protocolo}</span>
                        <span className="text-xs text-slate-400 tabular-nums">
                          {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </Card>
        </FadeIn>
      </section>
    )
  }

  // ─── Dashboard ADMIN (padrão) ────────────────────────────────────────────
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
      <FadeIn>
        <div className="mb-6 sm:mb-8">
          <p className="text-sm text-slate-500 capitalize mb-1">{today}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Painel da Secretaria</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão geral das atividades do Portal PNAB Irecê.
          </p>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <StatCard {...stat} />
          </StaggerItem>
        ))}
      </StaggerContainer>

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
