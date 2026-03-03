'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome,
  IconClipboard,
  IconUser,
  IconClose,
  IconLogout,
} from '@/components/ui'

interface ProponenteSidebarProps {
  userName: string
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/proponente',
    icon: <IconHome className="h-5 w-5" />,
  },
  {
    label: 'Minhas Inscrições',
    href: '/proponente/inscricoes',
    icon: <IconClipboard className="h-5 w-5" />,
  },
  {
    label: 'Meu Perfil',
    href: '/proponente/perfil',
    icon: <IconUser className="h-5 w-5" />,
  },
]

export function ProponenteSidebar({ userName }: ProponenteSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/proponente') return pathname === '/proponente'
    return pathname.startsWith(href)
  }

  return (
    <>
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" aria-hidden="true" />

      {/* Overlay mobile */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 z-40 bg-black/50 hidden peer-checked:block lg:!hidden"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform -translate-x-full peer-checked:translate-x-0 lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        {/* Faixa accent no topo */}
        <div className="h-1 bg-gradient-to-r from-brand-600 via-accent-500 to-brand-600 shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            PNAB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Portal PNAB</p>
            <p className="text-xs text-accent-400 truncate">{userName}</p>
          </div>
          <label
            htmlFor="sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Fechar menu"
          >
            <IconClose className="h-5 w-5" />
          </label>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu do proponente">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                isActive(item.href)
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              ].join(' ')}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Rodapé */}
        <div className="px-3 py-4 border-t border-slate-800">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors min-h-[44px]"
          >
            <IconLogout className="h-5 w-5" />
            Sair
          </Link>
        </div>
      </aside>
    </>
  )
}
