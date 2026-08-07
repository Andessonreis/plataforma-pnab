import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getNextDeadline } from '@/lib/utils/cronograma'
import { parseBrazilDateTime } from '@/lib/utils/format'
import { DashboardHero } from './dashboard-hero'
import { OpenEditaisBanner } from './open-editais-banner'
import { DashboardStats } from './dashboard-stats'
import { DashboardSidebar } from './dashboard-sidebar'
import { RecentInscricoesSection } from './recent-inscricoes-section'

export const metadata: Metadata = {
  title: 'Minha Área — Portal PNAB Irecê',
}

export default async function ProponenteDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [
    totalInscricoes,
    inscricoesEnviadas,
    inscricoesContempladas,
    editaisAbertosCount,
    recentInscricoes,
    draftInscricoes,
    draftCount,
    openEditais,
    recentNotifications,
    unreadNotificationsCount,
  ] = await Promise.all([
    prisma.inscricao.count({ where: { proponenteId: userId } }),
    prisma.inscricao.count({ where: { proponenteId: userId, status: 'ENVIADA' } }),
    prisma.inscricao.count({ where: { proponenteId: userId, status: 'CONTEMPLADA' } }),
    prisma.edital.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
    prisma.inscricao.findMany({
      where: { proponenteId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { edital: { select: { titulo: true, slug: true } } },
    }),
    prisma.inscricao.findMany({
      where: { proponenteId: userId, status: 'RASCUNHO' },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: { edital: { select: { titulo: true, slug: true } } },
    }),
    prisma.inscricao.count({ where: { proponenteId: userId, status: 'RASCUNHO' } }),
    prisma.edital.findMany({
      where: { status: 'INSCRICOES_ABERTAS' },
      select: { id: true, titulo: true, slug: true, cronograma: true },
      take: 10,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.notification.count({ where: { userId, lidaEm: null } }),
  ])

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })

  // Um prazo por edital aberto (o próximo marco futuro do cronograma),
  // ordenados pelo mais urgente.
  const upcomingDeadlines = openEditais
    .map((edital) => {
      const next = getNextDeadline(edital.cronograma)
      if (!next) return null
      return {
        editalId: edital.id,
        editalTitulo: edital.titulo,
        slug: edital.slug,
        label: next.label,
        dataHora: next.dataHora,
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => parseBrazilDateTime(a.dataHora).getTime() - parseBrazilDateTime(b.dataHora).getTime())
    .slice(0, 3)

  const nearestDeadline = upcomingDeadlines[0] ?? null
  const nearestDraft = draftInscricoes[0]
    ? { id: draftInscricoes[0].id, editalTitulo: draftInscricoes[0].edital.titulo }
    : null

  return (
    <section className="space-y-6 sm:space-y-8">
      <DashboardHero
        firstName={session.user.name?.split(' ')[0] ?? 'Proponente'}
        today={today}
        nearestDeadline={nearestDeadline}
        deadlines={upcomingDeadlines}
        draftCount={draftCount}
        nearestDraft={nearestDraft}
        editaisAbertosCount={editaisAbertosCount}
      />

      <OpenEditaisBanner
        count={editaisAbertosCount}
        editais={openEditais.map((e) => ({ titulo: e.titulo, slug: e.slug }))}
      />

      <DashboardStats
        total={totalInscricoes}
        pendentes={inscricoesEnviadas}
        contempladas={inscricoesContempladas}
        editaisAbertos={editaisAbertosCount}
      />

      {/* Inscrições recentes em largura total (prazos já não mora mais aqui,
          foi pro hero) — rascunhos/notificações formam a segunda zona,
          lado a lado, não uma coluna lateral estreita empurrada pro canto. */}
      <RecentInscricoesSection inscricoes={recentInscricoes} total={totalInscricoes} />

      <DashboardSidebar
        drafts={draftInscricoes.map((d) => ({
          id: d.id,
          numero: d.numero,
          editalTitulo: d.edital.titulo,
          updatedAt: d.updatedAt,
        }))}
        draftCount={draftCount}
        notifications={recentNotifications}
        unreadCount={unreadNotificationsCount}
      />
    </section>
  )
}
