import type { ReactNode } from 'react'

interface GradePainelProps {
  /** Primeiro bloco da tela: coluna larga no desktop, topo no celular. */
  abertura: ReactNode
  /** Segundo bloco: ao lado da abertura no desktop, logo abaixo dela no celular. */
  aoLado: ReactNode | null
  /** Conteúdo de uso diário na coluna larga (inscrições). */
  principal: ReactNode
  /** Pilha de apoio na coluna estreita. */
  apoio: ReactNode
  /**
   * Abertura e peça ao lado em metades iguais, com a mesma altura. Para dois
   * blocos de peso parecido (Memorial e convite a editais), que espremidos na
   * coluna estreita de 21rem ficavam mais altos que a abertura.
   */
  dividida?: boolean
}

/**
 * Grade do painel. A ordem do DOM é a ordem de leitura no celular e a ordem
 * do foco em qualquer tela, então quem decide a prioridade monta os blocos
 * na ordem certa e a grade só posiciona: no desktop, as duas primeiras peças
 * dividem a primeira linha. Sem peça ao lado da abertura, a pilha de apoio
 * sobe e ocupa a coluna estreita desde o topo.
 */
export function GradePainel({ abertura, aoLado, principal, apoio, dividida = false }: GradePainelProps) {
  if (dividida) {
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-x-12">
        {/* Cada bloco estica até a altura da linha (`h-full` no filho do item), então os dois terminam juntos. */}
        <div className="grid gap-10 lg:col-span-2 lg:grid-cols-2 lg:gap-x-12 [&>*]:min-w-0 lg:[&>*>*]:h-full">
          <div>{abertura}</div>
          {aoLado && <div>{aoLado}</div>}
        </div>
        <div className="min-w-0">{principal}</div>
        <div className="min-w-0 space-y-10">{apoio}</div>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-x-12">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{abertura}</div>
      {aoLado && <div className="min-w-0 lg:col-start-2 lg:row-start-1">{aoLado}</div>}
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">{principal}</div>
      <div className={`min-w-0 space-y-10 lg:col-start-2 ${aoLado ? 'lg:row-start-2' : 'lg:row-span-2 lg:row-start-1'}`}>
        {apoio}
      </div>
    </div>
  )
}
