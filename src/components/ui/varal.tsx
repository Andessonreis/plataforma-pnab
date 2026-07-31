interface VaralProps {
  /** Classes extras da faixa — use para ajustar altura ou cor de fundo. */
  className?: string
}

/**
 * Varal de bandeirinhas da identidade visual da Secretaria, repetido na
 * horizontal. Serve como divisor entre seções e como topo do rodapé.
 *
 * A arte é escura, então a faixa carrega fundo claro por padrão: sobre
 * superfícies escuras as bandeirinhas desapareceriam.
 */
export function Varal({ className = '' }: VaralProps) {
  return (
    <div
      className={`h-10 w-full bg-papel-100 bg-repeat-x ${className}`}
      style={{
        backgroundImage: 'url(/images/secult/bandeirinhas.png)',
        backgroundSize: 'auto 100%',
        backgroundPosition: 'center',
      }}
      aria-hidden="true"
    />
  )
}
