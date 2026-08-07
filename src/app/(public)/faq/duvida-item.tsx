import type { Duvida } from './consulta'

interface DuvidaItemProps {
  duvida: Duvida
  abertoPorPadrao?: boolean
}

/**
 * Um par pergunta/resposta em `<details>/<summary>` nativo.
 *
 * Extraído do caderno único para ser reusado igual na camada "Comece por
 * aqui" e em cada caderno de edital, evitando duas implementações do mesmo
 * acordeão divergirem com o tempo.
 */
export function DuvidaItem({ duvida, abertoPorPadrao = false }: DuvidaItemProps) {
  return (
    <details className="group py-1" open={abertoPorPadrao}>
      <summary className="flex cursor-pointer list-none items-start gap-4 py-4 titulo text-lg leading-snug tracking-wide text-tinta-900 transition-colors marker:content-none hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500">
        <span
          className="mt-1 shrink-0 font-questrial text-xl leading-none text-accent-600 transition-transform group-open:rotate-45"
          aria-hidden="true"
        >
          +
        </span>
        {duvida.pergunta}
      </summary>
      <p className="whitespace-pre-line pb-5 pl-9 text-[0.9375rem] leading-relaxed text-tinta-700">
        {duvida.resposta}
      </p>
    </details>
  )
}
