'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { IconChevronLeft, IconChevronRight } from '@/components/ui'
import { focoEscuro } from './estilos'
import { usePager } from './use-pager'

interface VisitasPagerProps {
  /** Cartões já renderizados no servidor, da visita mais próxima para a mais distante. */
  slides: ReactNode[]
  /** Cada visita em poucas palavras ("15 out, 16:15"), para anunciar a que vem depois. */
  resumos: string[]
}

const botaoQuadrado =
  `inline-flex h-12 w-12 shrink-0 items-center justify-center border-2 select-none touch-manipulation ${focoEscuro} ` +
  'transition-transform active:scale-[0.96]'
const botaoSeta = `${botaoQuadrado} border-current [@media(hover:hover)]:hover:bg-papel-50/10`

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

/**
 * Passa pelas visitas marcadas uma de cada vez: setas na tela e no teclado,
 * arrasto lateral no celular. A troca automática fica desligada até a pessoa
 * ligar, e some para quem pediu menos movimento ao sistema.
 */
export function VisitasPager({ slides, resumos }: VisitasPagerProps) {
  const total = slides.length
  const { indice, direcao, automatico, alternarAutomatico, anterior, proximo, handlers } = usePager(total)
  const palco = useRef<HTMLDivElement>(null)
  const montado = useRef(false)

  // Entrada curta na direção da troca; com movimento reduzido, só o esmaecer.
  useEffect(() => {
    if (!montado.current) {
      montado.current = true
      return
    }
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const de = reduzir ? { opacity: 0 } : { opacity: 0, transform: `translateX(${direcao * 16}px)` }
    const para = reduzir ? { opacity: 1 } : { opacity: 1, transform: 'translateX(0)' }
    palco.current?.animate([de, para], { duration: reduzir ? 160 : 220, easing: EASE_OUT })
  }, [indice, direcao])

  const seguinte = resumos[indice + 1]

  return (
    <div role="group" aria-roledescription="carrossel" aria-label="Próximas visitas" className="touch-pan-y" {...handlers}>
      <div ref={palco} aria-live={automatico ? 'off' : 'polite'} aria-atomic="true">
        <p className="sr-only">
          Visita {indice + 1} de {total}.
        </p>
        {slides[indice]}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button type="button" onClick={anterior} aria-label="Visita anterior" className={botaoSeta}>
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={proximo} aria-label="Próxima visita" className={botaoSeta}>
          <IconChevronRight className="h-5 w-5" />
        </button>

        <div className="ml-2 min-w-0 flex-1" aria-hidden="true">
          <p className="text-sm font-bold tabular-nums">
            {indice + 1} de {total}
          </p>
          <p className="text-sm leading-snug text-papel-100">{seguinte ? `Depois: ${seguinte}` : `Volta para: ${resumos[0]}`}</p>
        </div>

        <button
          type="button"
          onClick={alternarAutomatico}
          aria-pressed={automatico}
          aria-label="Passar as visitas sozinho"
          title={automatico ? 'Parar a troca automática' : 'Passar as visitas sozinho'}
          className={`${botaoQuadrado} motion-reduce:hidden ${automatico ? 'border-papel-50 bg-papel-50 text-ameixa-800' : 'border-papel-50/30 [@media(hover:hover)]:hover:bg-papel-50/10'}`}
        >
          <IconeTroca ligado={automatico} />
        </button>
      </div>
    </div>
  )
}

/** Pausa quando está passando sozinho, play quando está parado. */
function IconeTroca({ ligado }: { ligado: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      {ligado ? <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" /> : <path d="M6 4l10 6-10 6z" />}
    </svg>
  )
}
