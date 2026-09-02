import Link from 'next/link'
import type { NavItem } from './nav-items'
import type { RoleTheme } from './role-theme'

interface AdminNavLinkProps {
  item: NavItem
  active: boolean
  highlighted: boolean
  badgeCount: number | null
  theme: RoleTheme
}

/** Fecha o menu no mobile ao navegar — sem isto a sidebar ficava aberta cobrindo a tela nova. */
export function fecharSidebarAdminMobile() {
  const toggle = document.getElementById('admin-sidebar-toggle')
  if (toggle instanceof HTMLInputElement) toggle.checked = false
}

/**
 * Item de navegação do backoffice — preenchimento sólido no estado ativo
 * (não só um traço fino), na cor exclusiva do papel logado (`theme`).
 */
export function AdminNavLink({ item, active, highlighted, badgeCount, theme }: AdminNavLinkProps) {
  return (
    <Link
      href={item.href}
      onClick={fecharSidebarAdminMobile}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm min-h-[44px]',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60',
        active
          ? `${theme.activeBg} font-bold ${theme.activeText} shadow-sm`
          : highlighted
            ? `${theme.highlightText} ${theme.highlightBg} hover:brightness-110 ring-1 ring-inset ${theme.highlightRing}`
            : 'font-medium text-papel-100/55 hover:bg-papel-100/10 hover:text-papel-100',
      ].join(' ')}
    >
      <span className={active ? theme.activeText : highlighted ? theme.highlightIcon : 'text-papel-100/45'}>
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {badgeCount !== null && (
        <span
          className={[
            'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums',
            active ? 'bg-black/20' : `${theme.activeBg} ${theme.activeText}`,
          ].join(' ')}
          aria-label={`${badgeCount} ${badgeCount === 1 ? 'pendência' : 'pendências'}`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  )
}
