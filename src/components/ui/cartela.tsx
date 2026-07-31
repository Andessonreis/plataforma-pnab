interface CartelaProps {
  children: React.ReactNode
  /** Âncora da seção, para o sumário do documento. */
  id?: string
  className?: string
}

/**
 * Título de seção dentro da cartela da identidade.
 *
 * A Secretaria não usa faixa reta nem título solto: as chamadas das peças
 * vivem dentro de uma moldura de canto entalhado com filete duplo. Aqui ela
 * separa as partes do edital, no lugar de um `h2` em cima de um cartão branco.
 */
export function Cartela({ children, id, className = '' }: CartelaProps) {
  return (
    <h2
      id={id}
      className={`cartela inline-flex scroll-mt-32 items-center bg-tinta-900 px-6 py-3 font-rye text-xl leading-none tracking-wide text-papel-50 sm:text-2xl ${className}`}
    >
      {children}
    </h2>
  )
}
