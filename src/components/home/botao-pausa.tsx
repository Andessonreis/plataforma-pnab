interface BotaoPausaProps {
  pausado: boolean
  onAlternar: () => void
}

/**
 * Pausa da troca automática (WCAG 2.2.2): com poucos segundos por slide, quem
 * lê devagar precisa conseguir parar o carrossel de vez, não só enquanto o
 * ponteiro estiver em cima dele.
 */
export function BotaoPausa({ pausado, onAlternar }: BotaoPausaProps) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-pressed={pausado}
      aria-label={pausado ? 'Retomar a troca automática dos destaques' : 'Pausar a troca automática dos destaques'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-papel-100 transition-colors hover:bg-papel-50/10 focus-visible:outline-2 focus-visible:outline-accent-300"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {pausado ? <path d="M7 4.5v15l13-7.5-13-7.5Z" /> : <path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z" />}
      </svg>
    </button>
  )
}
