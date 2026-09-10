'use client'

import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { IconClose, IconStar, IconShield, UserAvatar } from '@/components/ui'
import { AdminNavLink } from '@/app/admin/nav-link'
import { getRoleTheme } from '@/app/admin/role-theme'
import type { NavItem } from '@/app/admin/nav-items'

interface AvaliadorSidebarProps {
  userName: string
}

const theme = getRoleTheme('AVALIADOR')

/**
 * Duas frentes de trabalho, sem tela de resumo antes delas: a seleção de edital
 * de "Minhas Avaliações" já abre com as contagens por edital, então um painel
 * agregado só adicionava um clique antes do trabalho.
 */
const navItems: NavItem[] = [
  {
    label: 'Minhas Avaliações',
    href: '/avaliador/inscricoes',
    roles: ['AVALIADOR'],
    icon: <IconStar className="h-5 w-5" />,
  },
  {
    label: 'Recursos',
    href: '/avaliador/recursos',
    roles: ['AVALIADOR'],
    icon: <IconShield className="h-5 w-5" />,
  },
]

/**
 * Sidebar do avaliador — mesma âncora escura (tinta-900) e o mesmo item de
 * navegação do restante do backoffice, com o recorte de cor do papel
 * (`role-theme`: ameixa). O checkbox de abrir/fechar reusa o id
 * `admin-sidebar-toggle` porque é o que `AdminNavLink` fecha ao navegar no
 * mobile; os dois layouts nunca são renderizados juntos.
 */
export function AvaliadorSidebar({ userName }: AvaliadorSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <input type="checkbox" id="admin-sidebar-toggle" className="peer hidden" aria-hidden="true" />

      {/* Overlay mobile */}
      <label
        htmlFor="admin-sidebar-toggle"
        className="fixed inset-0 z-40 bg-tinta-950/50 hidden peer-checked:block lg:!hidden"
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-papel-100/10 bg-tinta-900 transform -translate-x-full peer-checked:translate-x-0 lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-papel-100/10">
          <div className={`h-10 w-10 rounded-lg ${theme.soloBg} flex items-center justify-center ${theme.soloText} font-bold text-xs shrink-0`}>
            PNAB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-papel-50 truncate">Avaliação de Mérito</p>
            <p className="text-xs text-papel-100/50 truncate">{userName} — Avaliador</p>
          </div>
          <label
            htmlFor="admin-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-papel-100/60 hover:bg-papel-100/10 lg:hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            aria-label="Fechar menu"
          >
            <IconClose className="h-5 w-5" />
          </label>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide" aria-label="Menu do avaliador">
          {navItems.map((item) => (
            <AdminNavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              highlighted={false}
              badgeCount={null}
              theme={theme}
            />
          ))}
        </nav>

        {/* Rodapé — usuário + sair */}
        <div className="border-t border-papel-100/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <UserAvatar nome={userName} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-papel-50 truncate">{userName}</p>
              <p className="text-xs text-papel-100/50 truncate">Avaliador</p>
            </div>
          </div>
          <div className="px-3 pb-4">
            <LogoutButton
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-papel-100/60 hover:text-red-400 transition-colors duration-150 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            />
          </div>
        </div>
      </aside>
    </>
  )
}
