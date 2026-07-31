interface IconeProps {
  className?: string
}

/**
 * Ícones entalhados, na mesma mão dos ornamentos da identidade.
 *
 * O conjunto genérico de traço fino do projeto não conversa com a linguagem
 * de xilogravura da Secretaria: ao lado do sol em espiral e do casario, um
 * ícone de contorno de 1,5px parece de outro sistema. Estes são de massa
 * cheia, com o recorte feito na cor do papel, como quem tira o material da
 * matriz. Todos herdam a cor por `currentColor`.
 */

/** Prazo — sol de meio-dia com o ponteiro cravado, tempo que corre. */
export function IconePrazo({ className = '' }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="presentation" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="11.2"
          y="0.5"
          width="1.6"
          height="3.4"
          fill="currentColor"
          transform={`rotate(${i * 45} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="7.6" fill="currentColor" />
      <path
        d="M12 7.4v5.1l3.2 2"
        fill="none"
        stroke="var(--recorte, #f0e9d7)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Recursos — moeda batida, com a estrela do cordel no lugar do brasão. */
export function IconeRecursos({ className = '' }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="presentation" aria-hidden="true">
      <circle cx="12" cy="12" r="9.4" fill="currentColor" />
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="var(--recorte, #f0e9d7)" strokeWidth="1.1" />
      <path
        d="M12 6.6l1.55 3.5 3.65.35-2.75 2.5.82 3.7L12 14.7l-3.27 1.95.82-3.7-2.75-2.5 3.65-.35Z"
        fill="var(--recorte, #f0e9d7)"
      />
    </svg>
  )
}

/** Edital — folha com o canto dobrado e as linhas do texto vazadas. */
export function IconeEdital({ className = '' }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="presentation" aria-hidden="true">
      <path d="M4.4 1.8h10.1l5.1 5.2v15.2H4.4Z" fill="currentColor" />
      <path d="M14.5 1.8 19.6 7h-5.1Z" fill="var(--recorte, #f0e9d7)" />
      <g fill="var(--recorte, #f0e9d7)">
        <rect x="7.3" y="10.4" width="9.4" height="1.5" />
        <rect x="7.3" y="13.8" width="9.4" height="1.5" />
        <rect x="7.3" y="17.2" width="6" height="1.5" />
      </g>
    </svg>
  )
}
