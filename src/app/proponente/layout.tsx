import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProponenteSidebar } from './sidebar'
import { IconMenu } from '@/components/ui'

export default async function ProponenteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ProponenteSidebar userName={session.user.name ?? 'Proponente'} />

      <div className="flex-1 lg:ml-64">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-200 border-t-2 border-t-brand-500 px-4 py-3 lg:px-6">
          <label
            htmlFor="sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <IconMenu className="h-6 w-6" />
          </label>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-slate-600 hidden sm:block">
              {session.user.name}
            </span>
            <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-medium shadow-sm">
              {(session.user.name ?? 'P').charAt(0).toUpperCase()}
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
