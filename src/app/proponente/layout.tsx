import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProponenteSidebar } from './sidebar'
import { prisma } from '@/lib/db'
import { IconMenu, UserAvatar } from '@client/components/ui'
import { NotificationBell } from '@client/components/layout'

export default async function ProponenteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  // Carrega avatarUrl pra mostrar no header e na sidebar.
  // Não está na session (NextAuth) — buscar é leve e dispensa migração de schema da session.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  })
  const nome = session.user.name ?? 'Proponente'
  const avatarUrl = user?.avatarUrl ?? null

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ProponenteSidebar userName={nome} userAvatarUrl={avatarUrl} />

      <div className="flex-1 min-w-0 lg:ml-64">
        {/* Barra superior */}
        <header className="lg:sticky lg:top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm px-4 py-2 lg:px-6 lg:py-3">
          <label
            htmlFor="sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <IconMenu className="h-6 w-6" />
          </label>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <NotificationBell listLink="/proponente/notificacoes" />
            <span className="text-sm text-slate-600 hidden sm:block">
              {nome}
            </span>
            <UserAvatar nome={nome} src={avatarUrl} size={32} className="ring-2 ring-brand-100" />
          </div>
        </header>

        <main className="p-4 pb-24 lg:p-6 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
