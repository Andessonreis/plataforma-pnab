'use client'

import { IconQuestion } from '@/components/ui'
import { iniciarTour, type TourStep } from '@/lib/tour/use-tour'

interface TourButtonProps {
  passos: TourStep[]
  label?: string
  className?: string
}

/** Botão que dispara um tour guiado — mesmo padrão "Fazer tutorial" em toda a área do proponente.
 * Cada página traz seus próprios passos (ver `*-tour-steps.ts` ao lado de cada tela). */
export function TourButton({ passos, label = 'Fazer tutorial', className = '' }: TourButtonProps) {
  return (
    <button
      type="button"
      onClick={() => iniciarTour(passos)}
      className={`rotulo inline-flex shrink-0 items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-xs text-tinta-950 shadow-sm transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-50 ${className}`}
    >
      <IconQuestion className="h-4 w-4" />
      {label}
    </button>
  )
}
