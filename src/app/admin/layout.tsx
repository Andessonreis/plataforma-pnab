import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { AdminSidebar } from './sidebar'
import { IconMenu } from '@/components/ui'

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar
        userName={session.user.name ?? 'Usuário'}
        userRole={role}
        roleLabel={roleLabels[role] ?? role}
      />

      <div className="flex-1 lg:ml-64">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm px-4 py-3 lg:px-6">
          <label
            htmlFor="admin-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <IconMenu className="h-6 w-6" />
          </label>

          <div className="flex items-center gap-3 ml-auto">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${roleBadgeColors[role] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
              {roleLabels[role] ?? role}
            </span>
            <span className="text-sm text-slate-600 hidden sm:block">
              {session.user.name}
            </span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm font-medium shadow-sm ring-2 ring-brand-100">
              {(session.user.name ?? 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
