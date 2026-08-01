/** Cores institucionais, na ordem em que a identidade as aplica no símbolo. */
export type CorCartela = 'tinta' | 'oliva' | 'ameixa' | 'turquesa' | 'terracota'

/** Exportado para que outras peças da identidade (ex.: as faixas das telas de
 *  acesso) usem a mesma tradução de cor institucional para classe de fundo. */
export const CORES_CARTELA: Record<CorCartela, string> = {
  tinta: 'bg-tinta-900',
  oliva: 'bg-oliva-700',
  ameixa: 'bg-ameixa-700',
  turquesa: 'bg-turquesa-700',
  terracota: 'bg-brand-700',
}

/** As mesmas cores como tinta de traço — para peças que herdam por
 *  `currentColor`, como a serrilha que costura duas faixas. */
export const CORES_TRACO_CARTELA: Record<CorCartela, string> = {
  tinta: 'text-tinta-900',
  oliva: 'text-oliva-700',
  ameixa: 'text-ameixa-700',
  turquesa: 'text-turquesa-700',
  terracota: 'text-brand-700',
}

interface CartelaProps {
  children: React.ReactNode
  /** Âncora da seção, para o sumário do documento. */
  id?: string
  cor?: CorCartela
  className?: string
}

/**
 * Título de seção dentro da cartela da identidade.
 *
 * A Secretaria não usa faixa reta nem título solto: as chamadas das peças
 * vivem dentro de uma moldura de canto entalhado com filete duplo. Aqui ela
 * separa as partes do edital, no lugar de um `h2` em cima de um cartão branco.
 *
 * A cor vem da paleta institucional inteira, e não de um tom só. O símbolo da
 * Secretaria é feito de blocos chapados de âmbar, terracota, ameixa, turquesa
 * e oliva encostados; usar apenas dois deles, e ainda por cima diluídos,
 * devolvia uma página monocromática que não se parece com a marca.
 */
export function Cartela({ children, id, cor = 'tinta', className = '' }: CartelaProps) {
  return (
    <h2
      id={id}
      className={`cartela inline-flex scroll-mt-32 items-center ${CORES_CARTELA[cor]} px-6 py-3 titulo text-xl leading-none tracking-wide text-papel-50 sm:text-2xl ${className}`}
    >
      {children}
    </h2>
  )
}
