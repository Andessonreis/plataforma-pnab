import type { Duvida } from './consulta'
import { DuvidaItem } from './duvida-item'

interface DuvidasGeralProps {
  duvidas: Duvida[]
  abertoPorPadrao: boolean
}

/**
 * Camada 1 - "Comece por aqui": dúvidas gerais, sempre visíveis, em coluna
 * única sem depender de nenhum breakpoint.
 */
export function DuvidasGeral({ duvidas, abertoPorPadrao }: DuvidasGeralProps) {
  return (
    <section id="faq-geral" aria-labelledby="faq-geral-heading" className="mt-12">
      <div className="border-b-2 border-tinta-900 pb-3">
        <h2
          id="faq-geral-heading"
          className="titulo text-2xl leading-tight tracking-wide text-tinta-900"
        >
          Comece por aqui
        </h2>
      </div>
      <div className="divide-y divide-tinta-900/15">
        {duvidas.map((duvida) => (
          <DuvidaItem key={duvida.id} duvida={duvida} abertoPorPadrao={abertoPorPadrao} />
        ))}
      </div>
    </section>
  )
}
