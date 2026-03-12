'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconStar, IconClose, IconLogout } from '@/components/ui'

interface AvaliadorSidebarProps {
  userName: string
}

const navItems = [
  { label: 'Painel', href: '/avaliador', icon: <IconHome className="h-5 w-5" /> },
  { label: 'Minhas Avaliações', href: '/avaliador/inscricoes', icon: <IconStar className="h-5 w-5" /> },
]

export function AvaliadorSidebar({ userName }: AvaliadorSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/avaliador') return pathname === '/avaliador'
    return pathname.startsWith(href)
  }

  return (
    <>
      <input type="checkbox" id="avaliador-sidebar-toggle" className="peer hidden" aria-hidden="true" />

      <label
        htmlFor="avaliador-sidebar-toggle"
        className="fixed inset-0 z-40 bg-black/50 hidden peer-checked:block lg:!hidden"
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform -translate-x-full peer-checked:translate-x-0 lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-600 shrink-0" />

        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            PNAB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Painel do Avaliador</p>
            <p className="text-xs text-slate-400 truncate">{userName}</p>
          </div>
          <label
            htmlFor="avaliador-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Fechar menu"
          >
            <IconClose className="h-5 w-5" />
          </label>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu do avaliador">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px]',
                isActive(item.href)
                  ? 'bg-white/10 text-white border-l-2 border-brand-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              ].join(' ')}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150 min-h-[44px]"
          >
            <IconLogout className="h-5 w-5" />
            Sair
          </Link>
        </div>
      </aside>
    </>
  )
}
