import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProponenteSidebar } from './sidebar'

export default async function ProponenteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ProponenteSidebar userName={session.user.name ?? 'Proponente'} />

      <div className="flex-1 lg:ml-64">
        {/* Barra superior mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 lg:px-6">
          {/* Botao menu mobile — controlado pelo sidebar */}
          <label
            htmlFor="sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-slate-600 hidden sm:block">
              {session.user.name}
            </span>
            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-medium">
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
