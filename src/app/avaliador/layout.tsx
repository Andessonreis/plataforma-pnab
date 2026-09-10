import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AvaliadorSidebar } from './sidebar'
import { getRoleTheme } from '@/app/admin/role-theme'
import { IconMenu, UserAvatar } from '@/components/ui'
import { variaveisDeFonte } from '../fontes'

const theme = getRoleTheme('AVALIADOR')

export default async function AvaliadorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/login')
  if (session.user.role !== 'AVALIADOR') redirect('/')

  const nome = session.user.name ?? 'Avaliador'

  return (
    // Mesmo wrapper do resto do backoffice: .tema-secult resolve --brand-*/
    // --accent-* pra terracota/dourado da identidade SECULT e as variáveis de
    // fonte carregam Anton/Questrial. Sem os dois, esta área caía no verde/âmbar
    // de fallback do Tailwind e no sans do sistema.
    <div className={`tema-secult font-questrial flex min-h-screen bg-papel-50 ${variaveisDeFonte}`}>
      <AvaliadorSidebar userName={nome} />

      <div className="flex-1 min-w-0 lg:ml-64">
        <header className="lg:sticky lg:top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur-sm border-b border-tinta-900/10 shadow-sm px-4 py-2 lg:px-6 lg:py-3">
          <label
            htmlFor="admin-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-tinta-700 hover:bg-papel-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <IconMenu className="h-6 w-6" />
          </label>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${theme.chipBg} ${theme.chipText} ${theme.chipRing}`}>
              Avaliador
            </span>
            <span className="text-sm text-tinta-700 hidden sm:block">{nome}</span>
            <UserAvatar nome={nome} size={32} className="ring-2 ring-accent-100" />
          </div>
        </header>

        <main className="w-full p-4 pb-24 lg:p-8 lg:pb-10 xl:px-10 2xl:px-14">
          {children}
        </main>
      </div>
    </div>
  )
}
