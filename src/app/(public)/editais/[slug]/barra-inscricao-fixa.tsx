'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'

interface BarraInscricaoFixaProps {
  inscricao: { href: string; rotulo: string }
}

/**
 * CTA de inscrição sempre alcançável no celular, em editais de leitura longa.
 *
 * Só aparece depois que a capa sai da tela — a capa já tem o botão, repetir
 * a barra por cima dela seria redundância. No desktop o equivalente mora
 * dentro da navegação sticky do documento (`DocumentoNav`); esta barra é
 * `lg:hidden` de propósito.
 */
export function BarraInscricaoFixa({ inscricao }: BarraInscricaoFixaProps) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const sentinela = document.getElementById('fim-capa')
    if (!sentinela) return
    const observador = new IntersectionObserver(
      ([entrada]) => setVisivel(!entrada.isIntersecting),
      { threshold: 0 },
    )
    observador.observe(sentinela)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-tinta-900 bg-papel-50 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 shadow-[0_-4px_12px_rgba(41,23,11,0.16)] transition-transform duration-200 lg:hidden ${
        visivel ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
      aria-hidden={!visivel}
    >
      <Link
        href={inscricao.href}
        tabIndex={visivel ? 0 : -1}
        className="group flex min-h-[48px] items-center justify-center gap-2 bg-accent-500 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900"
      >
        {inscricao.rotulo}
        <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  )
}
