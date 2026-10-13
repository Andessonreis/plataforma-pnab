'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

/** Intervalo da troca automática: lento o bastante para ler data, horário e situação. */
const INTERVALO_AUTO_MS = 8000
/** Arrasto horizontal mínimo, em px, para contar como troca de visita. */
const LIMIAR_SWIPE = 40

/**
 * Estado de um pager de N itens: índice, direção da última troca (para a
 * animação), setas do teclado, swipe e troca automática opcional.
 *
 * A troca automática começa desligada e para enquanto o ponteiro está em cima
 * ou o foco está dentro do bloco, para ninguém perder o que estava lendo.
 */
export function usePager(total: number) {
  const [indice, setIndice] = useState(0)
  const [direcao, setDirecao] = useState<1 | -1>(1)
  const [automatico, setAutomatico] = useState(false)
  const [pausado, setPausado] = useState(false)
  const inicioToque = useRef<{ x: number; y: number } | null>(null)

  const irPara = (alvo: number) => {
    if (alvo < 0 || alvo >= total || alvo === indice) return
    setDirecao(alvo > indice ? 1 : -1)
    setIndice(alvo)
  }

  // As setas dão a volta: depois da mais distante vem de novo a mais próxima,
  // e nenhum botão fica desabilitado com o foco em cima.
  const mover = (passo: 1 | -1) => {
    if (total < 2) return
    setDirecao(passo)
    setIndice((indice + passo + total) % total)
  }

  useEffect(() => {
    if (!automatico || pausado || total < 2) return
    const timer = window.setInterval(() => {
      setDirecao(1)
      setIndice((atual) => (atual + 1) % total)
    }, INTERVALO_AUTO_MS)
    return () => window.clearInterval(timer)
  }, [automatico, pausado, total])

  const aoTeclar = (e: KeyboardEvent) => {
    const acoes: Record<string, () => void> = {
      ArrowLeft: () => mover(-1),
      ArrowRight: () => mover(1),
      Home: () => irPara(0),
      End: () => irPara(total - 1),
    }
    if (!acoes[e.key]) return
    e.preventDefault()
    acoes[e.key]()
  }

  // Só o gesto mais horizontal que vertical troca de visita; o resto é rolagem da página.
  const aoTocar = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') inicioToque.current = { x: e.clientX, y: e.clientY }
  }
  const aoSoltar = (e: PointerEvent) => {
    const inicio = inicioToque.current
    inicioToque.current = null
    if (!inicio) return
    const dx = e.clientX - inicio.x
    if (Math.abs(dx) < LIMIAR_SWIPE || Math.abs(dx) < Math.abs(e.clientY - inicio.y)) return
    mover(dx < 0 ? 1 : -1)
  }

  return {
    indice,
    direcao,
    automatico,
    alternarAutomatico: () => setAutomatico((a) => !a),
    anterior: () => mover(-1),
    proximo: () => mover(1),
    handlers: {
      onKeyDown: aoTeclar,
      onPointerDown: aoTocar,
      onPointerUp: aoSoltar,
      onPointerCancel: () => (inicioToque.current = null),
      onMouseEnter: () => setPausado(true),
      onMouseLeave: () => setPausado(false),
      onFocus: () => setPausado(true),
      onBlur: (e: { currentTarget: Element; relatedTarget: Element | null }) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false)
      },
    },
  }
}
