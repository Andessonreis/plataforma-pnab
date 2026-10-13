'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ATALHO_MINHAS_VISITAS, isNavItemActive, navItems } from './nav-items'
import { NavLink } from './nav-link'

/**
 * Menu do proponente. No celular vira a barra de abas fixa no rodapé (alcance
 * do polegar, sem menu escondido); a partir de `lg` é a coluna do menu lateral.
 * Nas duas telas é tinta escura com fio dourado, a moldura fixa da área.
 * Um único elemento, para que os ids do tour guiado existam uma vez só.
 */
export function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname()

  return (
    <nav
      id="tour-menu"
      aria-label="Menu do proponente"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-accent-500 bg-tinta-950 pb-[env(safe-area-inset-bottom)] lg:static lg:flex-1 lg:overflow-y-auto lg:border-t-0 lg:bg-transparent lg:px-3 lg:py-2 lg:pb-2"
    >
      <ul className="flex lg:block lg:space-y-1">
        {navItems.map((item) => (
          <li key={item.id} className="flex flex-1 flex-col lg:block">
            <NavLink
              item={item}
              active={isNavItemActive(item.href, pathname)}
              badge={item.id === 'notificacoes' ? unreadCount : 0}
            />
            {item.id === 'memorial' && (
              <Link
                href={ATALHO_MINHAS_VISITAS.href}
                className="hidden min-h-[44px] items-center pl-11 pr-3 text-sm font-semibold text-papel-300 underline-offset-4 hover:text-accent-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 lg:flex"
              >
                {ATALHO_MINHAS_VISITAS.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
