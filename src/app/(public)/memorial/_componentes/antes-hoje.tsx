'use client'

import { useId, useState } from 'react'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'

interface AntesHojeProps {
  antes: string
  hoje: string
  /** Descreve o lugar retratado; entra no texto alternativo das duas fotos. */
  descricao: string
  quando: string | null
}

/**
 * Comparação ANTES/HOJE da mesma vista. O controle é um `range` nativo: funciona
 * com setas do teclado, arrasto no celular e leitor de tela, que anuncia quanto
 * de cada foto está à mostra.
 */
export function AntesHoje({ antes, hoje, descricao, quando }: AntesHojeProps) {
  const [posicao, setPosicao] = useState(50)
  const id = useId()
  const rotuloAntes = quando ? `Antes (${quando})` : 'Antes'

  return (
    <figure>
      <div className="relative aspect-[4/3] overflow-hidden bg-tinta-900/10 select-none">
        <label htmlFor={id} className="sr-only">
          Comparar antes e hoje: {descricao}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={posicao}
          onChange={(e) => setPosicao(Number(e.target.value))}
          aria-valuetext={`${posicao}% da foto antiga à mostra`}
          className="peer absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
        />
        <ImagemMemorial src={hoje} alt={`${descricao}, hoje`} sizes="(min-width: 1024px) 60rem, 100vw" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - posicao}% 0 0)` }}>
          <ImagemMemorial src={antes} alt={`${descricao}, ${rotuloAntes.toLowerCase()}`} sizes="(min-width: 1024px) 60rem, 100vw" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-papel-50 shadow-[0_0_6px_rgba(25,14,7,0.6)]" style={{ left: `${posicao}%` }} aria-hidden="true">
          <span className="absolute top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-papel-50 bg-tinta-950/70" />
        </div>
        <span className="pointer-events-none absolute inset-0 ring-inset peer-focus-visible:ring-4 peer-focus-visible:ring-accent-400" aria-hidden="true" />
        <span className="pointer-events-none absolute left-3 top-3 bg-tinta-950/80 px-2 py-1 text-xs font-semibold text-papel-50" aria-hidden="true">
          {rotuloAntes}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 bg-tinta-950/80 px-2 py-1 text-xs font-semibold text-papel-50" aria-hidden="true">
          Hoje
        </span>
      </div>
      <figcaption className="mt-2 text-sm text-tinta-600">Arraste ou use as setas do teclado para comparar.</figcaption>
    </figure>
  )
}
