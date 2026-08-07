interface ParCampoValor {
  rotulo: string
  valor: React.ReactNode
}

interface CampoValorCardProps {
  titulo: string
  pares: ParCampoValor[]
  /** Realce visual — usado na classificação para marcar a linha contemplada. */
  destaque?: boolean
}

/**
 * Entidade com pares rótulo/valor, em cartão — o reflow de tabela no celular.
 *
 * `QuadroVagas` e `TabelaClassificacao` continuam tabela em telas largas,
 * onde a comparação entre linhas e colunas é o propósito do quadro. Abaixo
 * de `sm` a mesma leitura vira cartão por categoria/proposta, porque nenhuma
 * das tabelas cabe em ~360px sem rolagem forçada — e cartão sem fio por fio
 * lê melhor que uma tabela espremida.
 */
export function CampoValorCard({ titulo, pares, destaque = false }: CampoValorCardProps) {
  return (
    <div className={`border-2 p-4 ${destaque ? 'border-oliva-700 bg-oliva-700/10' : 'border-tinta-900/15 bg-papel-50'}`}>
      <h4 className="titulo text-lg leading-snug tracking-wide text-tinta-900">{titulo}</h4>
      <dl className="mt-3 space-y-2 border-t border-dashed border-tinta-900/15 pt-3">
        {pares.map((par) => (
          <div key={par.rotulo} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-tinta-600">{par.rotulo}</dt>
            <dd className="font-semibold tabular-nums text-tinta-900">{par.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
