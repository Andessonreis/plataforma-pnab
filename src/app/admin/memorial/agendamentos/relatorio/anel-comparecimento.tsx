interface Props {
  /** Realizadas ÷ (realizadas + faltas), de 0 a 1. null enquanto nenhuma visita foi encerrada. */
  taxa: number | null
  realizadas: number
  faltas: number
}

const RAIO = 52
const CIRCUNFERENCIA = 2 * Math.PI * RAIO

/** Anel do comparecimento: o arco cheio é quem veio; o resto do círculo, quem faltou. */
export function AnelComparecimento({ taxa, realizadas, faltas }: Props) {
  const percentual = taxa === null ? null : Math.round(taxa * 100)
  const resumo =
    percentual === null
      ? 'Nenhuma visita encerrada neste período ainda.'
      : `${realizadas} realizadas e ${faltas} faltas.`

  return (
    <figure className="flex items-center gap-4 sm:flex-col sm:items-start lg:flex-row lg:items-center" aria-label="Comparecimento">
      <svg viewBox="0 0 120 120" role="img" aria-label={percentual === null ? 'Comparecimento sem dados' : `Comparecimento de ${percentual}%`} className="h-28 w-28 shrink-0 -rotate-90">
        <circle cx="60" cy="60" r={RAIO} fill="none" strokeWidth="10" className="stroke-white/20" strokeDasharray={percentual === null ? '3 7' : undefined} />
        {taxa !== null && taxa > 0 && (
          <circle
            cx="60"
            cy="60"
            r={RAIO}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-turquesa-300"
            strokeDasharray={`${taxa * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
          />
        )}
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central" transform="rotate(90 60 60)" className="fill-white text-[26px] font-bold">
          {percentual === null ? '–' : `${percentual}%`}
        </text>
      </svg>
      <figcaption>
        <p className="text-base font-bold text-white">Comparecimento</p>
        <p className="mt-0.5 max-w-[16rem] text-sm text-papel-200">{resumo}</p>
      </figcaption>
    </figure>
  )
}
