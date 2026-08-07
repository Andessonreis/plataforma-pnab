import { useEffect, useState } from 'react'
import type { ParteDoEdital } from './document-nav'

/**
 * `top` acompanha a altura real do cabeçalho público via `ResizeObserver`, em
 * vez de um valor fixo: o cabeçalho recolhe ao rolar e difere entre mobile e
 * desktop, e um offset chumbado erraria em algum dos dois.
 */
function useTopoCabecalho(): number {
  const [topo, setTopo] = useState(0)

  useEffect(() => {
    const cabecalho = document.querySelector('header')
    if (!cabecalho) return
    const observador = new ResizeObserver(([entrada]) => setTopo(entrada.contentRect.height))
    observador.observe(cabecalho)
    return () => observador.disconnect()
  }, [])

  return topo
}

function useSecaoAtiva(partes: ParteDoEdital[]): string | null {
  const [ativa, setAtiva] = useState<string | null>(null)

  useEffect(() => {
    const alvos = partes
      .map((parte) => document.getElementById(parte.id))
      .filter((el): el is HTMLElement => el !== null)
    if (alvos.length === 0) return

    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.find((entrada) => entrada.isIntersecting)
        if (visivel) setAtiva(visivel.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    alvos.forEach((alvo) => observador.observe(alvo))
    return () => observador.disconnect()
  }, [partes])

  return ativa
}

export function useDocumentNavState(partes: ParteDoEdital[]) {
  return { ativa: useSecaoAtiva(partes), topoCabecalho: useTopoCabecalho() }
}
