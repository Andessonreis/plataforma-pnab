'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SolEspiral } from '@/components/ui/ornamentos'
import { SECOES, secaoAtiva } from './links'

interface MenuMobileProps {
  pathname: string
  aoFechar: () => void
}

/**
 * Menu do celular como sumário impresso, não como sanfona de links.
 *
 * Ocupa a tela inteira sobre tinta e lista as seções numeradas em corpo
 * grande, na ordem da régua. A sanfona anterior repetia a mesma lista miúda
 * do desktop dentro de uma faixa de 40px: no telefone, onde a navegação é o
 * único caminho, ela merece a página toda.
 *
 * O foco é levado para o painel ao abrir e devolvido a quem abriu ao fechar,
 * e Esc fecha — o painel cobre a página inteira e prende a navegação por
 * teclado se não fizer isso.
 */
export function MenuMobile({ pathname, aoFechar }: MenuMobileProps) {
  const painel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    painel.current?.focus()
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [aoFechar])

  return (
    <motion.div
      ref={painel}
      id="menu-secoes"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Seções do portal"
      className="fixed inset-0 z-50 overflow-y-auto bg-tinta-950 lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <SolEspiral
        className="pointer-events-none absolute -right-16 top-24 h-56 w-56 text-accent-300/10"
      />

      <div className="relative flex min-h-full flex-col px-6 pb-10 pt-5">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <a
              href="https://cidadesinteligentes.ifba.edu.br/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Projeto Cidades Inteligentes Municípios — IFBA (abre em nova aba)"
              className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-accent-400"
            >
              <Image
                src="/images/marca/logo-cidades-inteligentes-white.png"
                alt="Projeto Cidades Inteligentes Municípios — IFBA"
                width={280}
                height={80}
                className="h-7 w-auto max-w-[105px] object-contain sm:h-9 sm:max-w-none"
              />
            </a>
            <div className="h-5 w-px bg-papel-100/20" aria-hidden="true" />
            <Image
              src="/images/marca/logo-irece-white.png"
              alt="Prefeitura de Irecê — Secretaria de Cultura e Turismo"
              width={280}
              height={40}
              className="h-7 w-auto max-w-[130px] object-contain sm:h-9 sm:max-w-none"
            />
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-sm px-3 text-xs font-bold uppercase tracking-[0.14em] text-papel-200 transition-colors hover:text-accent-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Fechar
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ul className="flex-1">
          {SECOES.map((secao, i) => {
            const ativa = secaoAtiva(secao.href, pathname)
            return (
              <li key={secao.href} className="border-b border-papel-100/12">
                <Link
                  href={secao.href}
                  onClick={aoFechar}
                  aria-current={ativa ? 'page' : undefined}
                  className="flex items-baseline gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
                >
                  <span className="w-7 shrink-0 text-sm font-semibold tabular-nums text-accent-400/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`titulo text-2xl leading-tight tracking-wide ${
                      ativa ? 'text-accent-300' : 'text-papel-50'
                    }`}
                  >
                    {secao.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

      </div>
    </motion.div>
  )
}
