'use client'

import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '@/components/ui/spinner'

interface BotaoCarregandoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  carregando: boolean
  /** Classe de estilo de `estilos.ts` (botaoTinta, botaoContorno...). */
  estilo: string
}

/**
 * Botão de envio no desenho da casca do proponente (caixa alta, canto vivo).
 * O `Button` de `ui` é arredondado e terracota cheio, o que destoava das ações
 * do painel; aqui só se acrescenta o estado de espera.
 */
export function BotaoCarregando({ carregando, estilo, disabled, children, className = '', ...props }: BotaoCarregandoProps) {
  return (
    <button
      {...props}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={`${estilo} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {carregando && <Spinner aria-hidden="true" role="presentation" aria-label={undefined} />}
      {children}
    </button>
  )
}
