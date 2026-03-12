import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AvaliadorSidebar } from './sidebar'
import { IconMenu } from '@/components/ui'

export default async function AvaliadorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/login')
  if (session.user.role !== 'AVALIADOR') redirect('/')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AvaliadorSidebar userName={session.user.name ?? 'Avaliador'} />

      <div className="flex-1 min-w-0 lg:ml-64">
        <header className="lg:sticky lg:top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm px-4 py-2 lg:px-6 lg:py-3">
          <label
            htmlFor="avaliador-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <IconMenu className="h-6 w-6" />
          </label>

          <div className="flex items-center gap-3 ml-auto">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-200">
              Avaliador
            </span>
            <span className="text-sm text-slate-600 hidden sm:block">
              {session.user.name}
            </span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm font-medium shadow-sm ring-2 ring-brand-100">
              {(session.user.name ?? 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 pb-24 lg:p-6 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
