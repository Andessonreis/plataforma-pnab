import Link from 'next/link'
import { prisma } from '@server/lib/db'
import {
  Card,
  Badge,
  Button,
  EmptyState,
  FadeIn,
  IconCheck,
  IconQuestion,
  IconTicket,
  IconChatBubble,
  IconClock,
} from '@client/components/ui'
import { DashboardHeader } from '../_components/DashboardHeader'
import { KpiGrid } from '../_components/KpiGrid'
import { atendimentoStatusBadge, atendimentoStatusLabel } from '../page.helpers'

export async function AtendimentoDashboard({ today }: { today: string }) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [atdAbertos, atdEmAtendimento, atdFechadosHoje, totalFaq, atdRecentes] =
    await Promise.all([
      prisma.atendimento.count({ where: { status: 'ABERTO' } }),
      prisma.atendimento.count({ where: { status: 'EM_ATENDIMENTO' } }),
      prisma.atendimento.count({ where: { status: 'FECHADO', updatedAt: { gte: startOfToday } } }),
      prisma.faqItem.count({ where: { publicado: true } }),
      prisma.atendimento.findMany({
        where: { status: { in: ['ABERTO', 'EM_ATENDIMENTO'] } },
        orderBy: { createdAt: 'asc' },
        take: 8,
      }),
    ])

  const stats = [
    {
      label: 'Aguardando',
      value: atdAbertos,
      sub: 'abertos',
      color: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: <IconTicket className="h-6 w-6" />,
      href: '/admin/atendimentos?status=ABERTO',
    },
    {
      label: 'Em Andamento',
      value: atdEmAtendimento,
      sub: 'em atendimento',
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      icon: <IconChatBubble className="h-6 w-6" />,
      href: '/admin/atendimentos?status=EM_ATENDIMENTO',
    },
    {
      label: 'Fechados Hoje',
      value: atdFechadosHoje,
      sub: 'resolvidos hoje',
      color: 'bg-green-50',
      iconColor: 'text-green-600',
      icon: <IconCheck className="h-6 w-6" />,
      href: '/admin/atendimentos?status=FECHADO',
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
      <DashboardHeader
        today={today}
        title="Central de Atendimento"
        subtitle="Atendimentos pendentes e base de conhecimento do portal."
      />

      {/* KPI Cards */}
      <KpiGrid stats={stats} />

      {/* Ações rápidas */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
          <Button href="/admin/atendimentos" size="sm">
            <IconTicket className="h-4 w-4 mr-1.5" />
            Ver Atendimentos
          </Button>
          <Button href="/admin/atendimentos?status=ABERTO" variant="outline" size="sm">
            <IconClock className="h-4 w-4 mr-1.5" />
            Pendentes ({atdAbertos})
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
              Atendimentos Pendentes
            </h2>
            <Link
              href="/admin/atendimentos"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Ver todos
            </Link>
          </div>

          {atdRecentes.length === 0 ? (
            <EmptyState
              icon={<IconTicket className="h-8 w-8 text-slate-400" />}
              title="Nenhum atendimento pendente"
              description="Todos os atendimentos estão em dia."
            />
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="sm:hidden divide-y divide-slate-100 -mx-4">
                {atdRecentes.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/atendimentos/${ticket.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                      <IconTicket className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-mono text-slate-400">{ticket.protocolo}</p>
                        <Badge variant={atendimentoStatusBadge(ticket.status)}>
                          {atendimentoStatusLabel(ticket.status)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate">{ticket.assunto}</p>
                      <p className="text-xs text-slate-500 truncate">{ticket.nomeContato}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 tabular-nums mt-1">
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        timeZone: 'America/Sao_Paulo',
                      })}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Desktop: lista */}
              <div className="hidden sm:block divide-y divide-slate-100">
                {atdRecentes.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/atendimentos/${ticket.id}`}
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
                      <Badge variant={atendimentoStatusBadge(ticket.status)}>
                        {atendimentoStatusLabel(ticket.status)}
                      </Badge>
                      <span className="text-xs font-mono text-slate-400">{ticket.protocolo}</span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          timeZone: 'America/Sao_Paulo',
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
