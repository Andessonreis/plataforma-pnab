interface PontosCarrosselProps {
  total: number
  atual: number
  onSelecionar: (indice: number) => void
  /** Espaçamento e alinhamento de quem posiciona os pontos. */
  className?: string
}

/**
 * Indicadores do carrossel de destaques. Ficam fora das camadas que trocam,
 * presos ao pé do quadro: assim não somem nem pulam de lugar durante a troca,
 * qualquer que seja o arranjo do slide.
 *
 * A área de toque passa de 44px pelo pseudo-elemento, sem engordar o ponto.
 */
export function PontosCarrossel({ total, atual, onSelecionar, className = '' }: PontosCarrosselProps) {
  if (total < 2) return null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelecionar(i)}
          className={`relative h-2.5 rounded-full transition-all before:absolute before:-inset-x-1 before:-inset-y-4 before:content-[''] ${
            i === atual ? 'w-7 bg-accent-400' : 'w-2.5 bg-papel-100/35 hover:bg-papel-100/60'
          }`}
          aria-label={`Ver destaque ${i + 1} de ${total}`}
          aria-current={i === atual ? 'true' : undefined}
        />
      ))}
    </div>
  )
}
