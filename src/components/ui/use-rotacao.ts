'use client'

import { useEffect, useState } from 'react'

interface OpcoesRotacao {
  total: number
  intervaloMs: number
  /** Congela o ciclo — hover no carrossel, ou preferência por menos movimento. */
  pausado?: boolean
}

/**
 * Índice que avança em ciclo num intervalo fixo.
 *
 * Os três rodízios da home — destaques, fotos de fundo do banner e linguagens
 * culturais — precisavam da mesma coisa: avance de tempos em tempos, volte ao
 * começo no fim, pare com um item só. Estava reescrito em cada um.
 *
 * O índice sai normalizado pelo total, então a lista pode encolher (o admin
 * despublicar um slide) sem deixar o índice apontando para o vazio.
 */
export function useRotacao({ total, intervaloMs, pausado = false }: OpcoesRotacao) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (total < 2 || pausado) return
    const timer = setInterval(() => setIndice((atual) => (atual + 1) % total), intervaloMs)
    return () => clearInterval(timer)
  }, [total, intervaloMs, pausado])

  return [total > 0 ? indice % total : 0, setIndice] as const
}
