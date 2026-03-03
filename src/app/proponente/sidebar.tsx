'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ProponenteSidebarProps {
  userName: string
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/proponente',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Minhas Inscricoes',
    href: '/proponente/inscricoes',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Meu Perfil',
    href: '/proponente/perfil',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
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
      {/* Checkbox hack para abrir/fechar no mobile sem JS extra */}
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" aria-hidden="true" />

      {/* Overlay mobile */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 z-40 bg-black/50 hidden peer-checked:block lg:!hidden"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform -translate-x-full peer-checked:translate-x-0 lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        {/* Cabecalho */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            PNAB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Portal PNAB</p>
            <p className="text-xs text-slate-400 truncate">{userName}</p>
          </div>
          {/* Fechar no mobile */}
          <label
            htmlFor="sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Fechar menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </label>
        </div>

        {/* Navegacao */}
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

        {/* Rodape — Sair */}
        <div className="px-3 py-4 border-t border-slate-800">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors min-h-[44px]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </Link>
        </div>
      </aside>
    </>
  )
}
