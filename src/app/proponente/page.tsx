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
  IconClipboard,
  IconClock,
  IconCheck,
  IconNews,
  IconPlus,
  IconArrowRight,
} from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Minha Área — Portal PNAB Irecê',
}

export default async function ProponenteDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [totalInscricoes, inscricoesEnviadas, inscricoesContempladas, recentInscricoes, editaisAbertos] =
    await Promise.all([
      prisma.inscricao.count({ where: { proponenteId: userId } }),
      prisma.inscricao.count({
        where: { proponenteId: userId, status: 'ENVIADA' },
      }),
      prisma.inscricao.count({
        where: { proponenteId: userId, status: 'CONTEMPLADA' },
      }),
      prisma.inscricao.findMany({
        where: { proponenteId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { edital: { select: { titulo: true, slug: true } } },
      }),
      prisma.edital.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
    ])

  const stats = [
    {
      label: 'Total de Inscrições',
      value: totalInscricoes,
      icon: <IconClipboard className="h-6 w-6" />,
      color: 'bg-brand-50',
      iconColor: 'text-brand-600',
    },
    {
      label: 'Pendentes',
      value: inscricoesEnviadas,
      icon: <IconClock className="h-6 w-6" />,
      color: 'bg-accent-50',
      iconColor: 'text-accent-600',
    },
    {
      label: 'Contempladas',
      value: inscricoesContempladas,
      icon: <IconCheck className="h-6 w-6" />,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Editais Abertos',
      value: editaisAbertos,
      icon: <IconNews className="h-6 w-6" />,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ]

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <section>
      <FadeIn>
        <div className="mb-8">
          <p className="text-sm text-slate-500 capitalize mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-slate-900">
            Bem-vindo(a), {session.user.name?.split(' ')[0] ?? 'Proponente'}
          </h1>
          <p className="text-slate-500 mt-1">
            Acompanhe suas inscrições e gerencie seu perfil.
          </p>
        </div>
      </FadeIn>

      {/* Alerta de inscrições abertas */}
      {editaisAbertos > 0 && (
        <FadeIn delay={0.1}>
          <Link
            href="/editais"
            className="group flex items-center gap-3 rounded-xl border border-brand-200/60 bg-brand-50/40 px-4 py-3.5 mb-8 transition-all hover:bg-brand-50/70 hover:border-brand-200"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-600" />
            </span>
            <span className="text-sm text-brand-800">
              <strong>Inscrições abertas!</strong>
              {' — '}
              Edital PNAB 2025 — Fomento às Artes está com inscrições abertas até 30/06.
            </span>
            <IconArrowRight className="ml-auto h-4 w-4 text-brand-500 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
          </Link>
        </FadeIn>
      )}

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
          <Button href="/editais">
            <IconPlus className="h-4 w-4 mr-2" />
            Ver Editais Abertos
          </Button>
          <Button href="/proponente/inscricoes" variant="outline">
            Minhas Inscrições
          </Button>
        </div>
      </FadeIn>

      {/* Inscrições recentes */}
      <FadeIn delay={0.3}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Inscrições Recentes</h2>
            {totalInscricoes > 5 && (
              <Link href="/proponente/inscricoes" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                Ver todas
              </Link>
            )}
          </div>

          {recentInscricoes.length === 0 ? (
            <EmptyState
              icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
              title="Nenhuma inscrição ainda"
              description="Confira os editais abertos e faça sua primeira inscrição."
              action={{ label: 'Ver Editais Abertos', href: '/editais' }}
            />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Número</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Edital</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Data</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInscricoes.map((inscricao) => (
                    <tr key={inscricao.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-600">{inscricao.numero}</td>
                      <td className="py-3.5 px-3 font-medium text-slate-800">{inscricao.edital.titulo}</td>
                      <td className="py-3.5 px-3">
                        <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                          {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {new Date(inscricao.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href={`/proponente/inscricoes/${inscricao.id}`}
                          className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                        >
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </FadeIn>
    </section>
  )
}
