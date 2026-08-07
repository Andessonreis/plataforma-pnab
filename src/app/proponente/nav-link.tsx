import Link from 'next/link'
import type { NavItem } from './nav-items'

interface NavLinkProps {
  item: NavItem
  active: boolean
}

/** Fecha o menu no mobile — sem isto, navegar por um link deixava a sidebar
 * aberta cobrindo a tela nova em vez de recolher sozinha. */
export function fecharSidebarMobile() {
  const toggle = document.getElementById('sidebar-toggle')
  if (toggle instanceof HTMLInputElement) toggle.checked = false
}

/**
 * Item de navegação da sidebar do proponente — extraído pra isolar o estilo ativo/hover do container da lista.
 * O estado ativo marca por preenchimento sólido (não só um traço fino) — em 4
 * itens de menu, é a leitura mais rápida de "onde eu estou agora".
 */
export function NavLink({ item, active }: NavLinkProps) {
  return (
    <Link
      id={`tour-nav-${item.id}`}
      href={item.href}
      onClick={fecharSidebarMobile}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm min-h-[44px]',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
        active
          ? 'bg-accent-500 font-bold text-tinta-950 shadow-sm'
          : 'font-medium text-papel-100/55 hover:bg-papel-100/10 hover:text-papel-100',
      ].join(' ')}
    >
      <span className={active ? 'text-tinta-950' : 'text-papel-100/45'}>{item.icon}</span>
      {item.label}
    </Link>
  )
}
