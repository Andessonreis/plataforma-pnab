import { numero, type Variacao } from './calculos'

interface Props {
  variacao: Variacao
  /** Valor do período anterior, mostrado ao lado para o percentual não ficar solto. */
  anterior: number
  className?: string
}

const SETA = {
  mais: 'M6 2 11 9H1z',
  menos: 'M6 10 1 3h10z',
} as const

/**
 * Diferença para o período anterior. A direção vai em seta e em texto (leitor de tela
 * e daltonismo), nunca só em cor: mais ou menos não é bom nem ruim por si, depende do número.
 */
export function VariacaoPeriodo({ variacao, anterior, className = '' }: Props) {
  if (variacao.tipo === 'nada') return null

  let conteudo: React.ReactNode
  if (variacao.tipo === 'sem-base') {
    conteudo = 'Nada no período anterior'
  } else if (variacao.tipo === 'igual') {
    conteudo = `Igual ao período anterior (${numero(anterior)})`
  } else {
    conteudo = (
      <>
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 shrink-0 fill-current">
          <path d={SETA[variacao.tipo]} />
        </svg>
        <span className="font-bold tabular-nums">{variacao.percentual}%</span>
        <span className="sr-only">{variacao.tipo === 'mais' ? ' a mais' : ' a menos'} que no período anterior,</span>
        <span aria-hidden="true">{variacao.tipo === 'mais' ? 'a mais' : 'a menos'}</span>
        <span className="tabular-nums">(antes: {numero(anterior)})</span>
      </>
    )
  }

  return <p className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm ${className}`}>{conteudo}</p>
}
