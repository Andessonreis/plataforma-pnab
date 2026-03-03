import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { AdminSidebar } from './sidebar'

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR']

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  ATENDIMENTO: 'Atendimento',
  HABILITADOR: 'Habilitador',
  AVALIADOR: 'Avaliador',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/login')

  const role = session.user.role as UserRole
  if (!ROLES_PERMITIDOS.includes(role)) redirect('/')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar
        userName={session.user.name ?? 'Usuario'}
        userRole={role}
        roleLabel={roleLabels[role] ?? role}
      />

      <div className="flex-1 lg:ml-64">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 lg:px-6">
          <label
            htmlFor="admin-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>

          <div className="flex items-center gap-3 ml-auto">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
              {roleLabels[role] ?? role}
            </span>
            <span className="text-sm text-slate-600 hidden sm:block">
              {session.user.name}
            </span>
            <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-medium">
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
