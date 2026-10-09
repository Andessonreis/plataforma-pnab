import Link from 'next/link'
import type { NavItem } from './nav-items'

interface NavLinkProps {
  item: NavItem
  active: boolean
  /** Contagem exibida em selo (ex.: avisos não lidos). */
  badge?: number
}

/**
 * Item do menu do proponente. O mesmo elemento serve às duas telas: aba da
 * barra inferior no celular (ícone sobre rótulo curto) e linha do menu
 * lateral no desktop. O menu é escuro e o item ativo é papel: no desktop ele
 * avança até a borda da coluna e se emenda na página, como a aba de uma
 * pasta, a leitura mais rápida de "onde estou".
 */
export function NavLink({ item, active, badge = 0 }: NavLinkProps) {
  return (
    <Link
      id={`tour-nav-${item.id}`}
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={[
        'relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-sm transition-colors',
        'lg:min-h-[48px] lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-base',
        'focus-visible:outline-2 focus-visible:outline-offset-[-4px]',
        active
          ? 'bg-papel-50 font-bold text-tinta-950 focus-visible:outline-brand-700 lg:-mr-3 lg:pr-6'
          : 'font-semibold text-papel-200 focus-visible:outline-accent-400 [@media(hover:hover)]:hover:bg-papel-50/10 [@media(hover:hover)]:hover:text-papel-50',
      ].join(' ')}
    >
      {item.icon}
      <span className="lg:hidden">{item.curto}</span>
      <span className="hidden lg:inline">{item.label}</span>
      {badge > 0 && (
        <span
          className={`absolute right-[calc(50%-1.75rem)] top-1.5 min-w-5 px-1 text-center text-xs font-bold leading-5 lg:static lg:ml-auto ${
            active ? 'bg-tinta-950 text-accent-300' : 'bg-accent-500 text-tinta-950'
          }`}
        >
          {badge}
          <span className="sr-only"> não lidas</span>
        </span>
      )}
    </Link>
  )
}
