import type { ReactNode } from 'react'
import type { TourStep } from '@/lib/tour/use-tour'
import { faixaAbertura } from '../estilos'
import { TourButton } from '../tour-button'

interface CabecalhoPaginaProps {
  /** Âncora do bloco, usada pelo primeiro passo do tour da página. */
  id: string
  titulo: string
  resumo?: ReactNode
  /** Ações da página, à direita do título no desktop e abaixo dele no celular. */
  acoes?: ReactNode
  passosTour: TourStep[]
}

/**
 * Faixa de abertura das telas da área do proponente: título em Anton sobre
 * terracota profunda, uma linha de contexto e as ações alinhadas pela base do
 * título. É a âncora escura do alto da página; o miolo abaixo volta ao papel.
 * Ações de contorno herdam o papel da faixa (`border-current`).
 */
export function CabecalhoPagina({ id, titulo, resumo, acoes, passosTour }: CabecalhoPaginaProps) {
  return (
    <header id={id} className={`${faixaAbertura} flex flex-wrap items-end justify-between gap-x-6 gap-y-5`}>
      <div className="min-w-0">
        <h1 className="titulo text-4xl text-papel-50 sm:text-5xl">{titulo}</h1>
        {resumo && <p className="mt-2 max-w-prose text-papel-100">{resumo}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {acoes}
        <TourButton passos={passosTour} />
      </div>
    </header>
  )
}
