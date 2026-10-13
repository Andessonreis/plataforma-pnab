'use client'

import { useEffect, useState } from 'react'
import { DURACAO_TROCA_S } from './troca'

interface OpcoesAutoplay {
  total: number
  /** Tempo de leitura de cada slide, configurado no painel. */
  intervaloMs: number
  /** Desligado pela Comunicação ou por quem pede menos movimento. */
  ativo: boolean
}

/**
 * Troca automática da abertura. O relógio recomeça a cada slide e soma a
 * duração da transição, então o tempo configurado é todo de leitura, com o
 * slide já inteiro. Duas pausas convivem: a temporária (ponteiro ou foco dentro
 * do quadro) e a da pessoa, pelo botão, que só sai quando ela retoma.
 */
export function useAutoplay({ total, intervaloMs, ativo }: OpcoesAutoplay) {
  const [indice, setIndice] = useState(0)
  const [pausadoPelaPessoa, setPausadoPelaPessoa] = useState(false)
  const [suspenso, setSuspenso] = useState(false)
  const rodando = ativo && total > 1 && !pausadoPelaPessoa && !suspenso

  useEffect(() => {
    if (!rodando) return
    const timer = setTimeout(() => setIndice((i) => (i + 1) % total), intervaloMs + DURACAO_TROCA_S * 1000)
    return () => clearTimeout(timer)
  }, [indice, rodando, total, intervaloMs])

  return {
    atual: total > 0 ? indice % total : 0,
    irPara: setIndice,
    pausadoPelaPessoa,
    alternarPausa: () => setPausadoPelaPessoa((p) => !p),
    suspender: setSuspenso,
  }
}
