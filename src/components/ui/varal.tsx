import { Casario } from './ornamentos'

interface VaralProps {
  /** Classes extras da faixa — use para ajustar altura ou cor de fundo. */
  className?: string
}

/** Cópias do ornamento lado a lado — cobre telas ultrawide sem repetir cedo
 *  demais; o excesso é cortado pelo `overflow-hidden` do container. */
const PECAS = 40

/**
 * Casario repetido na horizontal — skyline sertanejo da identidade da
 * Secretaria. Serve como divisor entre seções e como topo do rodapé, no
 * lugar do antigo varal de bandeirinhas.
 *
 * O ornamento usa `currentColor`, então a cor sai do texto do container
 * (`text-brand-700`); fundo claro por padrão pra manter contraste sobre
 * superfícies escuras.
 */
export function Varal({ className = '' }: VaralProps) {
  return (
    <div
      className={`flex h-10 w-full items-end overflow-hidden bg-papel-100 text-brand-700 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: PECAS }, (_, i) => (
        <Casario key={i} className="h-full w-auto shrink-0" />
      ))}
    </div>
  )
}
