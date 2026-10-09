export type Etapa = 'regras' | 'horario' | 'grupo' | 'perguntas' | 'aceite'

const NOMES: Record<Etapa, string> = {
  regras: 'Regras',
  horario: 'Data e horário',
  grupo: 'Grupo',
  perguntas: 'Perguntas',
  aceite: 'Confirmar',
}

/**
 * Onde a pessoa está no pedido. No celular cabe só "Etapa 2 de 5 — Data e horário"
 * e a régua; a lista com todos os nomes aparece a partir do tablet.
 */
export function IndicadorEtapas({ etapas, atual }: { etapas: Etapa[]; atual: number }) {
  return (
    <nav aria-label="Etapas do pedido">
      <p className="text-sm text-tinta-700">
        Etapa {atual + 1} de {etapas.length}
        <span className="text-tinta-900"> — {NOMES[etapas[atual]]}</span>
      </p>

      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {etapas.map((e, i) => (
          <span key={e} className={`h-1.5 flex-1 ${i <= atual ? 'bg-oliva-700' : 'bg-tinta-900/15'}`} />
        ))}
      </div>

      <ol className="mt-3 hidden gap-4 text-xs text-tinta-600 sm:flex">
        {etapas.map((e, i) => (
          <li key={e} aria-current={i === atual ? 'step' : undefined} className={i === atual ? 'font-semibold text-tinta-900' : ''}>
            {i + 1}. {NOMES[e]}
          </li>
        ))}
      </ol>
    </nav>
  )
}
