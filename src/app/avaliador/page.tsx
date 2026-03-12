import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  Card, Badge, Button, StatCard, EmptyState,
  FadeIn, StaggerContainer, StaggerItem,
  IconClipboard, IconCheck, IconStar, IconChart, IconClock,
} from '@/components/ui'

export const metadata: Metadata = {
  title: 'Painel do Avaliador — Portal PNAB Irecê',
}

export default async function AvaliadorDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'AVALIADOR') redirect('/login')

  const userId = session.user.id
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const [pendentes, concluidas, concluidasHoje, avaliacoesRecentes] = await Promise.all([
    prisma.avaliacao.count({ where: { avaliadorId: userId, finalizada: false } }),
    prisma.avaliacao.count({ where: { avaliadorId: userId, finalizada: true } }),
    prisma.avaliacao.count({ where: { avaliadorId: userId, finalizada: true, updatedAt: { gte: startOfToday } } }),
    prisma.avaliacao.findMany({
      where: { avaliadorId: userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        inscricao: {
          select: {
            id: true,
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
      label: 'Pendentes', value: pendentes, sub: 'para avaliar',
      color: 'bg-amber-50', iconColor: 'text-amber-600',
      icon: <IconClipboard className="h-6 w-6" />, href: '/avaliador/inscricoes',
    },
    {
      label: 'Concluídas', value: concluidas, sub: 'avaliações feitas',
      color: 'bg-green-50', iconColor: 'text-green-600',
      icon: <IconCheck className="h-6 w-6" />, href: '/avaliador/inscricoes',
    },
    {
      label: 'Hoje', value: concluidasHoje, sub: 'avaliadas hoje',
      color: 'bg-blue-50', iconColor: 'text-blue-600',
      icon: <IconStar className="h-6 w-6" />, href: '/avaliador/inscricoes',
    },
    {
      label: 'Total Atribuídas', value: total, sub: 'inscrições designadas',
      color: 'bg-brand-50', iconColor: 'text-brand-600',
      icon: <IconChart className="h-6 w-6" />, href: '/avaliador/inscricoes',
    },
  ]

  return (
    <section>
      <FadeIn>
        <div className="mb-6 sm:mb-8">
          <p className="text-sm text-slate-500 capitalize mb-1">{today}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Painel de Avaliação</h1>
          <p className="text-sm text-slate-500 mt-1">
            Suas avaliações atribuídas e progresso de análise.
          </p>
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
          <Button href="/avaliador/inscricoes" size="sm">
            <IconClipboard className="h-4 w-4 mr-1.5" />
            Minhas Avaliações
          </Button>
          {pendentes > 0 && (
            <Button href="/avaliador/inscricoes" variant="outline" size="sm">
              <IconClock className="h-4 w-4 mr-1.5" />
              Pendentes ({pendentes})
            </Button>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Avaliações Recentes</h2>
            <Link href="/avaliador/inscricoes" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
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
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-slate-100 -mx-4">
                {avaliacoesRecentes.map((av) => {
                  const isPending = !av.finalizada
                  return (
                    <Link
                      key={av.id}
                      href={`/avaliador/inscricoes/${av.inscricaoId}`}
                      className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isPending ? 'bg-amber-50' : 'bg-green-50'}`}>
                        {isPending
                          ? <IconClipboard className="h-4 w-4 text-amber-600" />
                          : <IconCheck className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{av.inscricao.proponente.nome}</p>
                        <p className="text-xs text-slate-500 truncate">{av.inscricao.edital.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-400">{av.inscricao.numero}</span>
                          <Badge variant={isPending ? 'warning' : 'success'}>
                            {isPending ? 'Pendente' : `Nota: ${Number(av.notaTotal)}`}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2.5 px-4 sm:px-6 font-medium text-slate-500 text-xs uppercase tracking-wide">Inscrição</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Proponente</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">Edital</th>
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
                          <td className="py-3 px-4 font-medium text-slate-900">{av.inscricao.proponente.nome}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-[200px]">
                            <p className="truncate">{av.inscricao.edital.titulo}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={isPending ? 'warning' : 'success'}>
                              {isPending ? 'Pendente' : `Nota: ${Number(av.notaTotal)}`}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-right">
                            <Link
                              href={`/avaliador/inscricoes/${av.inscricaoId}`}
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
            </>
          )}
        </Card>
      </FadeIn>
    </section>
  )
}
