'use client'

import { usePathname } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { LogoutButton } from '@/components/logout-button'
import { IconClose, UserAvatar } from '@/components/ui'
import { navSections, isNavItemActive } from './nav-items'
import { AdminNavLink } from './nav-link'
import { getRoleTheme } from './role-theme'

interface AdminSidebarProps {
  userName: string
  userRole: UserRole
  roleLabel: string
  userAvatarUrl?: string | null
  /** Inscrições aguardando habilitação em editais ativos — destaca o item no menu */
  habilitacaoPendentes?: number
  /** Inscrições ainda não avaliadas por completo na fase de avaliação — alimenta o badge */
  avaliacaoPendentes?: number
  /** Há edital na fase de avaliação — destaca o item mesmo sem pendências */
  avaliacaoEmAndamento?: boolean
}

/**
 * Sidebar do backoffice — âncora escura (tinta-900) compartilhada por todo
 * papel interno, mas com um recorte de cor exclusivo por papel (`role-theme`):
 * oliva pro Habilitador, ameixa pro Avaliador, turquesa pro Atendimento,
 * dourado pro Admin. Antes disso o layout nunca entrava em `.tema-secult` —
 * as cores de marca caíam no fallback verde/âmbar genérico do Tailwind.
 */
export function AdminSidebar({
  userName,
  userRole,
  roleLabel,
  userAvatarUrl,
  habilitacaoPendentes = 0,
  avaliacaoPendentes = 0,
  avaliacaoEmAndamento = false,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const theme = getRoleTheme(userRole)

  function badgeCount(item: (typeof navSections)[number]['items'][number]): number | null {
    if (item.highlightKey === 'habilitacao' && habilitacaoPendentes > 0) return habilitacaoPendentes
    if (item.highlightKey === 'avaliacao' && avaliacaoPendentes > 0) return avaliacaoPendentes
    return null
  }

  function isHighlighted(item: (typeof navSections)[number]['items'][number], active: boolean): boolean {
    if (active) return false
    if (item.highlightKey === 'habilitacao') return habilitacaoPendentes > 0
    if (item.highlightKey === 'avaliacao') return avaliacaoEmAndamento
    return false
  }

  return (
    <>
      <input type="checkbox" id="admin-sidebar-toggle" className="peer hidden" aria-hidden="true" />

      {/* Overlay mobile */}
      <label
        htmlFor="admin-sidebar-toggle"
        className="fixed inset-0 z-40 bg-tinta-950/50 hidden peer-checked:block lg:!hidden"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-papel-100/10 bg-tinta-900 transform -translate-x-full peer-checked:translate-x-0 lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-papel-100/10">
          <div className={`h-10 w-10 rounded-lg ${theme.soloBg} flex items-center justify-center ${theme.soloText} font-bold text-xs shrink-0`}>
            PNAB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-papel-50 truncate">Backoffice</p>
            <p className="text-xs text-papel-100/50 truncate">{userName} — {roleLabel}</p>
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
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-hide" aria-label="Menu administrativo">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(userRole))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title}>
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-papel-100/35">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const active = isNavItemActive(item.href, pathname)
                    return (
                      <AdminNavLink
                        key={item.href}
                        item={item}
                        active={active}
                        highlighted={isHighlighted(item, active)}
                        badgeCount={badgeCount(item)}
                        theme={theme}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Rodapé — usuário + sair */}
        <div className="border-t border-papel-100/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <UserAvatar nome={userName} src={userAvatarUrl} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-papel-50 truncate">{userName}</p>
              <p className="text-xs text-papel-100/50 truncate">{roleLabel}</p>
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
