interface IconeProps {
  className?: string
}

/**
 * Ícones no vocabulário do símbolo da Secretaria: blocos chapados de cor
 * encostados, sem contorno e sem meio-tom.
 *
 * O símbolo é um mandacaru feito de âmbar, terracota, ameixa, turquesa e oliva
 * em massas sólidas. A versão anterior destes ícones era de uma cor só,
 * herdada por `currentColor`, e ao lado daquela marca parecia de outro
 * sistema — além de deixar a página inteira num tom só.
 *
 * As cores são fixas de propósito: são as da identidade, não do contexto. Como
 * todas são de meio-tom, funcionam tanto sobre papel quanto sobre tinta.
 */

const AMBAR = '#e7a523'
const TERRACOTA = '#b8441d'
const OLIVA = '#475c1b'
const TURQUESA = '#129fa6'
const AMEIXA = '#574655'
const PAPEL = '#ebe2c9'

/** Prazo — o sol que marca a hora, com o ponteiro cravado. */
export function IconePrazo({ className = '' }: IconeProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="presentation" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="14.6"
          y="0.5"
          width="2.8"
          height="5"
          rx="1.4"
          fill={AMBAR}
          transform={`rotate(${i * 45} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="10.5" fill={AMBAR} />
      <path
        d="M16 9.5v7h5.5"
        fill="none"
        stroke={TERRACOTA}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Recursos — a moeda com a estrela do cordel. */
export function IconeRecursos({ className = '' }: IconeProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="presentation" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill={TERRACOTA} />
      <circle cx="16" cy="16" r="10" fill={AMBAR} />
      <path
        d="M16 8.5l2.2 4.9 5.1.5-3.8 3.5 1.1 5.1L16 19.8l-4.6 2.7 1.1-5.1-3.8-3.5 5.1-.5Z"
        fill={TERRACOTA}
      />
    </svg>
  )
}

/** Edital — a folha com o canto dobrado e o texto vazado. */
export function IconeEdital({ className = '' }: IconeProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="presentation" aria-hidden="true">
      <path d="M5.5 2.5h13l8 8v19h-21Z" fill={PAPEL} />
      <path d="M18.5 2.5l8 8h-8Z" fill={AMEIXA} />
      <g fill={TURQUESA}>
        <rect x="9.5" y="14" width="13" height="2.4" rx="1.2" />
        <rect x="9.5" y="19" width="13" height="2.4" rx="1.2" />
      </g>
      <rect x="9.5" y="24" width="8" height="2.4" rx="1.2" fill={TERRACOTA} />
    </svg>
  )
}

/** Vagas — as três figuras do símbolo, ombro a ombro. */
export function IconeVagas({ className = '' }: IconeProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="presentation" aria-hidden="true">
      <circle cx="7.5" cy="10" r="4.5" fill={AMEIXA} />
      <path d="M1 27c0-3.6 2.9-6.5 6.5-6.5S14 23.4 14 27Z" fill={AMEIXA} />
      <circle cx="24.5" cy="10" r="4.5" fill={OLIVA} />
      <path d="M18 27c0-3.6 2.9-6.5 6.5-6.5S31 23.4 31 27Z" fill={OLIVA} />
      <circle cx="16" cy="7.5" r="5.5" fill={TURQUESA} />
      <path d="M8 28c0-4.4 3.6-8 8-8s8 3.6 8 8Z" fill={TURQUESA} />
    </svg>
  )
}

/** Regras — o carimbo batido sobre o papel. */
export function IconeRegras({ className = '' }: IconeProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="presentation" aria-hidden="true">
      <rect x="3" y="21" width="26" height="7" rx="1.5" fill={OLIVA} />
      <path d="M11 4.5h10v6l3 8.5H8l3-8.5Z" fill={TERRACOTA} />
      <rect x="11.5" y="8" width="9" height="2.6" rx="1.3" fill={AMBAR} />
    </svg>
  )
}
