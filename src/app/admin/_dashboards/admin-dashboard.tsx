import Link from 'next/link'
import {
  Card,
  Button,
  StatCard,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  IconNews,
  IconClipboard,
  IconUsers,
  IconCheck,
  IconPlus,
  IconExport,
} from '@/components/ui'
import { AtividadeRecente, type AuditLogEntry } from './admin/atividade-recente'

interface AdminDashboardProps {
  today: string
  totalEditais: number
  editaisAbertos: number
  totalInscricoes: number
  inscricoesEnviadas: number
  totalProponentes: number
  recentLogs: AuditLogEntry[]
}

export function AdminDashboard({
  today,
  totalEditais,
  editaisAbertos,
  totalInscricoes,
  inscricoesEnviadas,
  totalProponentes,
  recentLogs,
}: AdminDashboardProps) {
  const stats = [
    {
      label: 'Editais', value: totalEditais, sub: `${editaisAbertos} aberto(s)`,
      color: 'bg-brand-50', iconColor: 'text-brand-600',
      icon: <IconNews className="h-6 w-6" />, href: '/admin/editais',
    },
    {
      label: 'Inscrições', value: totalInscricoes, sub: `${inscricoesEnviadas} pendente(s)`,
      color: 'bg-accent-50', iconColor: 'text-accent-600',
      icon: <IconClipboard className="h-6 w-6" />, href: '/admin/inscricoes',
    },
    {
      label: 'Proponentes', value: totalProponentes, sub: 'cadastrados',
      color: 'bg-turquesa-50', iconColor: 'text-turquesa-600',
      icon: <IconUsers className="h-6 w-6" />, href: '/admin/usuarios',
    },
    {
      label: 'Editais Abertos', value: editaisAbertos, sub: 'com inscrições abertas',
      color: 'bg-emerald-50', iconColor: 'text-emerald-600',
      icon: <IconCheck className="h-6 w-6" />, href: '/admin/editais',
    },
  ]

  return (
    <section>
      <FadeIn>
        <div className="mb-6 sm:mb-8">
          <p className="text-sm text-tinta-700/60 capitalize mb-1">{today}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-tinta-950">Painel da Secretaria</h1>
          <p className="text-sm text-tinta-700/60 mt-1">Visão geral das atividades do Portal PNAB Irecê.</p>
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

      <FadeIn delay={0.3}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-tinta-950">Atividade Recente</h2>
            <Link href="/admin/logs" className="text-sm text-brand-700 hover:text-brand-800 font-medium">
              Ver todos
            </Link>
          </div>

          <AtividadeRecente logs={recentLogs} />
        </Card>
      </FadeIn>
    </section>
  )
}
