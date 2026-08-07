'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { IconClose, UserAvatar } from '@/components/ui'
import { navItems, isNavItemActive } from './nav-items'
import { NavLink, fecharSidebarMobile } from './nav-link'

interface ProponenteSidebarProps {
  userName: string
  userAvatarUrl?: string | null
}

export function ProponenteSidebar({ userName, userAvatarUrl }: ProponenteSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" aria-hidden="true" />

      {/* Overlay mobile */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 z-40 bg-slate-900/40 hidden peer-checked:block lg:!hidden"
        aria-hidden="true"
      />

      {/* Sidebar — âncora escura da identidade (tinta-900, um degrau mais claro
          que o tinta-950 da faixa "bem-vindo" abaixo do topbar) pra área logada
          se reconhecer como o mesmo produto da home em vez de um SaaS genérico
          à parte. Tom diferente do hero + fio dourado é o que separa as duas
          faixas escuras — sem isso elas se fundem num bloco só, sem leitura de
          onde uma área acaba e a outra começa. Área de trabalho continua clara. */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-accent-500/20 bg-tinta-900 transform -translate-x-full peer-checked:translate-x-0 lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        {/* Cabeçalho — identidade do portal */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-papel-100/10">
          <div className="h-10 w-10 rounded-lg bg-accent-500 flex items-center justify-center text-tinta-950 font-bold text-xs shrink-0">
            PNAB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-papel-50 truncate">Portal PNAB</p>
            <p className="text-xs text-papel-100/50 truncate">Área do proponente</p>
          </div>
          <label
            htmlFor="sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-papel-100/60 hover:bg-papel-100/10 lg:hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            aria-label="Fechar menu"
          >
            <IconClose className="h-5 w-5" />
          </label>
        </div>

        {/* Navegação */}
        <nav id="tour-menu" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu do proponente">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} active={isNavItemActive(item.href, pathname)} />
          ))}
        </nav>

        {/* Rodapé — identidade do usuário + sair */}
        <div className="border-t border-papel-100/10">
          <Link
            href="/proponente/perfil"
            onClick={fecharSidebarMobile}
            className="flex items-center gap-3 px-4 py-3 hover:bg-papel-100/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <UserAvatar nome={userName} src={userAvatarUrl} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-papel-50 truncate">{userName}</p>
              <p className="text-xs text-papel-100/50">Editar perfil</p>
            </div>
          </Link>
          <div className="px-3 pb-4">
            <LogoutButton
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-papel-100/60 hover:text-red-400 transition-colors duration-150 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            />
          </div>
        </div>
      </aside>
    </>
  )
}
