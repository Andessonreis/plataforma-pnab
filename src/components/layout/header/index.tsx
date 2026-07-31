'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { AccessibilityControls } from '../accessibility-controls'
import { ReguaSecoes } from './regua-secoes'
import { BotaoInscricao } from './botao-inscricao'
import { MenuMobile } from './menu-mobile'

interface HeaderProps {
  userAreaHref?: string
}

/**
 * Cabeçalho em três faixas, no lugar da barra única com links à direita.
 *
 * A composição é a de um cabeçalho impresso: a linha institucional em tinta,
 * o masthead com a marca, e a régua de seções ocupando a largura inteira
 * numa faixa própria. Tirar a navegação de perto da marca resolve a disputa
 * entre as duas e deixa cada seção com área de clique de verdade.
 *
 * Ao rolar, as duas primeiras faixas recolhem e sobra a régua com a marca
 * reduzida ao lado — o mesmo papel da titulação corrida no alto da página de
 * um livro. É por isso que o recolhimento existe, e não por efeito: mantém a
 * navegação acessível sem gastar um quinto da tela em toda rolagem.
 *
 * A detecção usa um sentinela com IntersectionObserver, e não escuta de
 * scroll: o listener dispara a cada quadro e força layout no fio principal.
 */
export function Header({ userAreaHref = '/login' }: HeaderProps) {
  const [recolhido, setRecolhido] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const sentinela = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const alvo = sentinela.current
    if (!alvo) return
    const observador = new IntersectionObserver(
      ([entrada]) => setRecolhido(!entrada.isIntersecting),
      { threshold: 0 },
    )
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    setMenuAberto(false)
  }, [pathname])

  return (
    <>
      <div ref={sentinela} aria-hidden="true" className="h-px" />

      <header className="tema-secult sticky top-0 z-40 font-questrial">
        <div
          className={`overflow-hidden bg-tinta-950 text-papel-200 transition-[max-height,opacity] duration-300 ${
            recolhido ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-9 items-center justify-between gap-3 text-xs">
              <span className="truncate font-semibold uppercase tracking-[0.16em]">
                <span className="sm:hidden">Cultura e Turismo · Irecê/BA</span>
                <span className="hidden sm:inline">
                  Secretaria de Cultura e Turismo · Prefeitura de Irecê/BA
                </span>
              </span>
              <AccessibilityControls />
            </div>
          </div>
        </div>

        <div className="border-b-[3px] border-brand-600 bg-papel-50">
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 lg:overflow-visible ${
              recolhido ? 'lg:max-h-0 lg:opacity-0' : 'lg:max-h-28 lg:opacity-100'
            }`}
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
              <Link
                href="/"
                className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
              >
                <Image
                  src="/images/marca/logo-irece-color.png"
                  alt="Prefeitura de Irecê, 100 anos — Secretaria de Cultura e Turismo"
                  width={280}
                  height={40}
                  className="h-8 w-auto object-contain sm:h-12"
                  priority
                />
              </Link>

              <div className="flex items-center gap-2">
                <BotaoInscricao href={userAreaHref} />

                <button
                  type="button"
                  onClick={() => setMenuAberto(true)}
                  aria-expanded={menuAberto}
                  aria-controls="menu-secoes"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-sm px-2 text-xs font-bold uppercase tracking-[0.14em] text-tinta-800 sm:px-3 transition-colors hover:bg-tinta-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 lg:hidden"
                >
                  <span className="flex flex-col gap-[3px]" aria-hidden="true">
                    <span className="block h-0.5 w-5 bg-current" />
                    <span className="block h-0.5 w-5 bg-current" />
                    <span className="block h-0.5 w-3 bg-current" />
                  </span>
                  <span className="hidden sm:inline">Seções</span>
                  <span className="sr-only sm:hidden">Abrir seções</span>
                </button>
              </div>
            </div>
          </div>

          <BotaoInscricao href={userAreaHref} faixa />

          {/* Recolhido, a marca acompanha a régua como titulação corrida. */}
          <div className="relative">
            {recolhido && (
              <Link
                href="/"
                className="absolute left-4 top-1/2 hidden -translate-y-1/2 sm:left-6 lg:left-8 lg:block"
                aria-label="Início"
              >
                <Image
                  src="/images/marca/brasao-irece.png"
                  alt=""
                  width={85}
                  height={97}
                  className="h-7 w-auto object-contain"
                />
              </Link>
            )}
            <ReguaSecoes pathname={pathname} compacta={recolhido} />
          </div>
        </div>

      </header>

      <AnimatePresence>
        {menuAberto && (
          <MenuMobile pathname={pathname} aoFechar={() => setMenuAberto(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
