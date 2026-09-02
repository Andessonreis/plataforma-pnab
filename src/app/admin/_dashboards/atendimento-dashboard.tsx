import Link from 'next/link'
import {
  Card,
  Button,
  StatCard,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  IconTicket,
  IconChatBubble,
  IconCheck,
  IconQuestion,
  IconClock,
} from '@/components/ui'
import { ListaTickets, type AtendimentoTicket } from './atendimento/lista-tickets'

interface AtendimentoDashboardProps {
  today: string
  atdAbertos: number
  atdEmAtendimento: number
  atdFechadosHoje: number
  totalFaq: number
  atdRecentes: AtendimentoTicket[]
}

export function AtendimentoDashboard({
  today,
  atdAbertos,
  atdEmAtendimento,
  atdFechadosHoje,
  totalFaq,
  atdRecentes,
}: AtendimentoDashboardProps) {
  const stats = [
    {
      label: 'Aguardando', value: atdAbertos, sub: 'abertos',
      color: 'bg-accent-50', iconColor: 'text-accent-600',
      icon: <IconTicket className="h-6 w-6" />, href: '/admin/atendimentos?status=ABERTO',
    },
    {
      label: 'Em Andamento', value: atdEmAtendimento, sub: 'em atendimento',
      color: 'bg-blue-50', iconColor: 'text-blue-600',
      icon: <IconChatBubble className="h-6 w-6" />, href: '/admin/atendimentos?status=EM_ATENDIMENTO',
    },
    {
      label: 'Fechados Hoje', value: atdFechadosHoje, sub: 'resolvidos hoje',
      color: 'bg-emerald-50', iconColor: 'text-emerald-600',
      icon: <IconCheck className="h-6 w-6" />, href: '/admin/atendimentos?status=FECHADO',
    },
    {
      label: 'FAQ Publicados', value: totalFaq, sub: 'itens ativos',
      color: 'bg-turquesa-50', iconColor: 'text-turquesa-600',
      icon: <IconQuestion className="h-6 w-6" />, href: '/admin/faq',
    },
  ]

  return (
    <section>
      <FadeIn>
        <div className="mb-6 sm:mb-8">
          <p className="text-sm text-tinta-700/60 capitalize mb-1">{today}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-tinta-950">Central de Atendimento</h1>
          <p className="text-sm text-tinta-700/60 mt-1">Atendimentos pendentes e base de conhecimento do portal.</p>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <StatCard {...stat} />
          </StaggerItem>
        ))}
      </StaggerContainer>

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

      <FadeIn delay={0.3}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-tinta-950">Atendimentos Pendentes</h2>
            <Link href="/admin/atendimentos" className="text-sm text-turquesa-700 hover:text-turquesa-800 font-medium">
              Ver todos
            </Link>
          </div>

          <ListaTickets tickets={atdRecentes} />
        </Card>
      </FadeIn>
    </section>
  )
}
