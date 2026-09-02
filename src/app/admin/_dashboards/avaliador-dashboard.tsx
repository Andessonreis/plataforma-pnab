import Link from 'next/link'
import {
  Card,
  Button,
  StatCard,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  IconClipboard,
  IconCheck,
  IconClock,
  IconStar,
  IconChart,
} from '@/components/ui'
import { ListaAvaliacoes, type AvaliacaoRecente } from './avaliador/lista-avaliacoes'

interface AvaliadorDashboardProps {
  today: string
  pendentes: number
  concluidas: number
  concluidasHoje: number
  avaliacoesRecentes: AvaliacaoRecente[]
}

export function AvaliadorDashboard({ today, pendentes, concluidas, concluidasHoje, avaliacoesRecentes }: AvaliadorDashboardProps) {
  const total = pendentes + concluidas

  const stats = [
    {
      label: 'Pendentes', value: pendentes, sub: 'para avaliar',
      color: 'bg-ameixa-50', iconColor: 'text-ameixa-600',
      icon: <IconClipboard className="h-6 w-6" />, href: '/admin/inscricoes',
    },
    {
      label: 'Concluídas', value: concluidas, sub: 'avaliações feitas',
      color: 'bg-emerald-50', iconColor: 'text-emerald-600',
      icon: <IconCheck className="h-6 w-6" />, href: '/admin/inscricoes',
    },
    {
      label: 'Hoje', value: concluidasHoje, sub: 'avaliadas hoje',
      color: 'bg-blue-50', iconColor: 'text-blue-600',
      icon: <IconStar className="h-6 w-6" />, href: '/admin/inscricoes',
    },
    {
      label: 'Total Atribuídas', value: total, sub: 'inscrições designadas',
      color: 'bg-ameixa-50', iconColor: 'text-ameixa-600',
      icon: <IconChart className="h-6 w-6" />, href: '/admin/inscricoes',
    },
  ]

  return (
    <section>
      <FadeIn>
        <div className="mb-6 sm:mb-8">
          <p className="text-sm text-tinta-700/60 capitalize mb-1">{today}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-tinta-950">Painel de Avaliação</h1>
          <p className="text-sm text-tinta-700/60 mt-1">Suas avaliações atribuídas e progresso de análise.</p>
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

      <FadeIn delay={0.3}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-tinta-950">Avaliações Recentes</h2>
            <Link href="/admin/inscricoes" className="text-sm text-ameixa-700 hover:text-ameixa-800 font-medium">
              Ver todas
            </Link>
          </div>

          <ListaAvaliacoes avaliacoes={avaliacoesRecentes} />

          {avaliacoesRecentes.length > 0 && total > 10 && (
            <div className="mt-4 pt-4 border-t border-papel-200">
              <Link href="/admin/inscricoes" className="text-sm text-ameixa-700 hover:text-ameixa-800 font-medium">
                Ver todas as {total} avaliações →
              </Link>
            </div>
          )}
        </Card>
      </FadeIn>
    </section>
  )
}
