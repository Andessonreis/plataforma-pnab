import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { AdminSidebar } from './sidebar'
import { prisma } from '@/lib/db'
import { IconMenu, UserAvatar } from '@/components/ui'
import { NotificationBell } from '@/components/layout'

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR']

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  ATENDIMENTO: 'Atendimento',
  HABILITADOR: 'Habilitador',
  AVALIADOR: 'Avaliador',
}

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-red-50 text-red-700 ring-red-200',
  ATENDIMENTO: 'bg-blue-50 text-blue-700 ring-blue-200',
  HABILITADOR: 'bg-amber-50 text-amber-700 ring-amber-200',
  AVALIADOR: 'bg-green-50 text-green-700 ring-green-200',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/login')

  const role = session.user.role as UserRole
  if (!ROLES_PERMITIDOS.includes(role)) redirect('/')

  // Carrega avatarUrl (não está na session). Hit leve no DB pelo layout.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  })
  const nome = session.user.name ?? 'Usuário'
  const avatarUrl = user?.avatarUrl ?? null

  // Pendências da fase de habilitação — alimenta o destaque do menu pra ADMIN
  const habilitacaoPendentes =
    role === 'ADMIN'
      ? await prisma.inscricao.count({
          where: {
            status: 'ENVIADA',
            edital: { status: 'HABILITACAO' },
          },
        })
      : 0

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar
        userName={nome}
        userRole={role}
        roleLabel={roleLabels[role] ?? role}
        userAvatarUrl={avatarUrl}
        habilitacaoPendentes={habilitacaoPendentes}
      />

      <div className="flex-1 min-w-0 lg:ml-64">
        {/* Barra superior */}
        {/* Header mobile — fixo apenas o hamburger */}
        <header className="lg:sticky lg:top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm px-4 py-2 lg:px-6 lg:py-3">
          <label
            htmlFor="admin-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <IconMenu className="h-6 w-6" />
          </label>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <NotificationBell listLink="/admin/notificacoes/historico" />
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${roleBadgeColors[role] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
              {roleLabels[role] ?? role}
            </span>
            <span className="text-sm text-slate-600 hidden sm:block">
              {nome}
            </span>
            <UserAvatar nome={nome} src={avatarUrl} size={32} className="ring-2 ring-brand-100" />
          </div>
        </header>

        <main className="w-full p-4 pb-24 lg:p-8 lg:pb-10 xl:px-10 2xl:px-14">
          {children}
        </main>
      </div>
    </div>
  )
}
