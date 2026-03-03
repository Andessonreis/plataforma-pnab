'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AccessibilityControls } from './accessibility-controls'

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/editais', label: 'Editais' },
  { href: '/projetos-apoiados', label: 'Projetos Apoiados' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contato', label: 'Contato' },
]

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header>
      {/* Barra superior institucional */}
      <div className="bg-brand-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between text-xs">
            <span>Secretaria de Arte e Cultura — Irecê/BA</span>
            <AccessibilityControls />
          </div>
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="bg-white border-b border-slate-200" aria-label="Navegação principal">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">Portal PNAB</p>
                <p className="text-xs text-slate-500 leading-tight">Irecê</p>
              </div>
            </Link>

            {/* Links desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'text-brand-700 bg-brand-50'
                        : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors min-h-[44px]"
              >
                Área do Proponente
              </Link>

              {/* Botão mobile */}
              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px]"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {mobileOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileOpen && (
          <div id="mobile-menu" className="lg:hidden border-t border-slate-200">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      'block px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'text-brand-700 bg-brand-50'
                        : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="pt-3 border-t border-slate-100">
                <Link
                  href="/login"
                  className="block w-full text-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Área do Proponente
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export { Header }
