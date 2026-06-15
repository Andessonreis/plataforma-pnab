import type { Metadata } from 'next'
import { auth } from '@server/lib/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { AtendimentoDashboard } from './_dashboards/AtendimentoDashboard'
import { HabilitadorDashboard } from './_dashboards/HabilitadorDashboard'
import { AvaliadorDashboard } from './_dashboards/AvaliadorDashboard'
import { AdminDashboard } from './_dashboards/AdminDashboard'

export const metadata: Metadata = {
  title: 'Painel Administrativo — Portal PNAB Irecê',
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
    timeZone: 'America/Sao_Paulo',
  })

  switch (role) {
    case 'ATENDIMENTO':
      return <AtendimentoDashboard today={today} />
    case 'HABILITADOR':
      return <HabilitadorDashboard today={today} />
    case 'AVALIADOR':
      return <AvaliadorDashboard today={today} session={session} />
    default:
      return <AdminDashboard today={today} />
  }
}
