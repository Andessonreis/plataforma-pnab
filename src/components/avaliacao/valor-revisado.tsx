interface ValorRevisadoProps {
  /** Valor antes da revisão, já formatado. */
  anterior: string
  /** Valor depois da revisão. */
  atual: React.ReactNode
  className?: string
}

/**
 * Valor revisado no recurso: o antigo riscado ao lado do novo, como a
 * retificação mostra a data que perdeu a validade. O leitor de tela ouve os
 * dois rótulos, porque o risco não se lê em voz alta.
 */
export function ValorRevisado({ anterior, atual, className = '' }: ValorRevisadoProps) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <s className="text-[0.7em] font-normal text-slate-400">
        <span className="sr-only">Valor anterior: </span>
        {anterior}
      </s>
      <span>
        <span className="sr-only">Valor revisado: </span>
        {atual}
      </span>
    </span>
  )
}

/** Selo que marca uma avaliação revisada no julgamento do recurso. */
export function SeloRevisadaNoRecurso({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 ${className}`}>
      Revisada no recurso
    </span>
  )
}
