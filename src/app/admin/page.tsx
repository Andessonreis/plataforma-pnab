import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import type { UserRole } from '@prisma/client'
import { AtendimentoDashboard } from './_dashboards/atendimento-dashboard'
import { AvaliadorDashboard } from './_dashboards/avaliador-dashboard'
import { AdminDashboard } from './_dashboards/admin-dashboard'

export const metadata: Metadata = {
  title: 'Painel Administrativo — Portal PNAB Irecê',
}

function hoje() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

function inicioDeHoje() {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  return data
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = session.user.role as UserRole
  const today = hoje()

  if (role === 'ATENDIMENTO') {
    const startOfToday = inicioDeHoje()

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

    return (
      <AtendimentoDashboard
        today={today}
        atdAbertos={atdAbertos}
        atdEmAtendimento={atdEmAtendimento}
        atdFechadosHoje={atdFechadosHoje}
        totalFaq={totalFaq}
        atdRecentes={atdRecentes}
      />
    )
  }

  // Habilitador não tem dashboard genérico — a tela dele é a seleção de
  // edital + fila de conferência em /admin/habilitacao (mesmo fluxo, mesmas
  // ações, e já era o que existia pro Admin; só faltava abrir pro papel).
  if (role === 'HABILITADOR') {
    redirect('/admin/habilitacao')
  }

  if (role === 'AVALIADOR') {
    const userId = session.user.id
    const startOfToday = inicioDeHoje()

    const [pendentes, concluidas, concluidasHoje, avaliacoesRecentes] = await Promise.all([
      prisma.avaliacao.count({ where: { avaliadorId: userId, finalizada: false } }),
      prisma.avaliacao.count({ where: { avaliadorId: userId, finalizada: true } }),
      prisma.avaliacao.count({
        where: { avaliadorId: userId, finalizada: true, updatedAt: { gte: startOfToday } },
      }),
      prisma.avaliacao.findMany({
        where: { avaliadorId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          inscricao: {
            select: {
              numero: true,
              categoria: true,
              proponente: { select: { nome: true } },
              edital: { select: { titulo: true, ano: true } },
            },
          },
        },
      }),
    ])

    return (
      <AvaliadorDashboard
        today={today}
        pendentes={pendentes}
        concluidas={concluidas}
        concluidasHoje={concluidasHoje}
        avaliacoesRecentes={avaliacoesRecentes}
      />
    )
  }

  const [totalEditais, editaisAbertos, totalInscricoes, inscricoesEnviadas, totalProponentes, recentLogs] =
    await Promise.all([
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

  return (
    <AdminDashboard
      today={today}
      totalEditais={totalEditais}
      editaisAbertos={editaisAbertos}
      totalInscricoes={totalInscricoes}
      inscricoesEnviadas={inscricoesEnviadas}
      totalProponentes={totalProponentes}
      recentLogs={recentLogs}
    />
  )
}
