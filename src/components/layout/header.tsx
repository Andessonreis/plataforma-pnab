'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Detectar scroll para adicionar sombra
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <header className={[
      'sticky top-0 z-40 transition-shadow duration-300',
      scrolled ? 'shadow-md shadow-slate-900/5' : '',
    ].join(' ')}>
      {/* Barra superior institucional */}
      <div className="bg-brand-950 text-white/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-9 items-center justify-between text-xs">
            <span className="font-medium tracking-wide truncate mr-2">
              <span className="sm:hidden">Sec. Arte e Cultura — Irecê/BA</span>
              <span className="hidden sm:inline">Secretaria de Arte e Cultura — Irecê/BA</span>
            </span>
            <AccessibilityControls />
          </div>
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="bg-white border-b border-slate-200/80" aria-label="Navegação principal">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-slate-200 group-hover:ring-brand-300 transition-all">
                <Image
                  src="https://www.irece.ba.gov.br/files/config/brasao.png"
                  alt="Brasão de Irecê"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-brand-700 transition-colors">
                  Portal PNAB
                </p>
                <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">Irecê/BA</p>
              </div>
            </Link>

            {/* Links desktop */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href)

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      'relative px-3.5 py-2 text-sm font-medium transition-colors rounded-md',
                      isActive
                        ? 'text-brand-700'
                        : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                    {/* Indicador ativo — underline */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute inset-x-1.5 -bottom-[1.05rem] h-0.5 bg-brand-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 active:bg-brand-800 transition-colors min-h-[44px] shadow-sm shadow-brand-600/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                Área do Proponente
              </Link>

              {/* Botão mobile */}
              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors min-h-[44px] min-w-[44px]"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.svg
                      key="close"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden="true"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="menu"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden="true"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-menu"
              className="lg:hidden border-t border-slate-200 overflow-hidden bg-white"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => {
                  const isActive = link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href)

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={[
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'text-brand-700 bg-brand-50'
                          : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50',
                      ].join(' ')}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-600 shrink-0" />
                      )}
                      {link.label}
                    </Link>
                  )
                })}
                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors min-h-[44px]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    Área do Proponente
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}

export { Header }
