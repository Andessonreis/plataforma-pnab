'use client'

import { IconQuestion } from '@/components/ui'
import { iniciarTour, type TourStep } from '@/lib/tour/use-tour'
import { botaoContorno } from './estilos'

interface TourButtonProps {
  passos: TourStep[]
  label?: string
  className?: string
}

/** Botão que dispara um tour guiado — mesmo padrão "Fazer tutorial" em toda a área do proponente.
 * De contorno, na cor do texto de onde estiver: o dourado fica reservado para a ação
 * principal da tela. Cada página traz seus próprios passos (ver `*-tour-steps.ts`). */
export function TourButton({ passos, label = 'Fazer tutorial', className = '' }: TourButtonProps) {
  return (
    <button type="button" onClick={() => iniciarTour(passos)} className={`${botaoContorno} shrink-0 ${className}`}>
      <IconQuestion className="h-4 w-4" />
      {label}
    </button>
  )
}
