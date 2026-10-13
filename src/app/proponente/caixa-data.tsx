interface CaixaDataProps {
  dia: string
  mes: string
  className?: string
}

/** Data do impresso da Secretaria: dia em corpo grande, mês em caixa alta (`.caixa-data` em globals.css). */
export function CaixaData({ dia, mes, className = '' }: CaixaDataProps) {
  return (
    <span className={`caixa-data shrink-0 ${className}`} aria-hidden="true">
      <span className="titulo text-2xl">{dia}</span>
      <span className="mt-1 text-xs font-bold uppercase tracking-widest">{mes}</span>
    </span>
  )
}
