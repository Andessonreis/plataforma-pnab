import { PASSOS, TOTAL_PASSOS } from './tipos'

interface TrilhaPassosProps {
  /** Etapa corrente, base zero. */
  passo: number
}

/**
 * Onde a pessoa está no cadastro.
 *
 * Três segmentos e uma contagem escrita. Sem bolinhas numeradas ligadas por
 * linha: o número já está por extenso na linha de cima, e o desenho de pílulas
 * conectadas ocupa três vezes mais altura para dizer a mesma coisa.
 *
 * A lista carrega os nomes das etapas para leitor de tela — quem enxerga lê o
 * título da etapa logo abaixo, e repetir os três em texto visível encheria o
 * topo do formulário.
 */
export function TrilhaPassos({ passo }: TrilhaPassosProps) {
  const { titulo, resumo } = PASSOS[passo]

  return (
    <div className="mb-7">
      <p className="text-sm font-medium text-slate-500">
        Passo {passo + 1} de {TOTAL_PASSOS}
      </p>

      <ol className="mt-2 flex gap-1.5" aria-label="Etapas do cadastro">
        {PASSOS.map((etapa, indice) => (
          <li
            key={etapa.titulo}
            aria-current={indice === passo ? 'step' : undefined}
            className={`h-1 flex-1 rounded-full transition-colors ${
              indice <= passo ? 'bg-brand-600' : 'bg-slate-200'
            }`}
          >
            <span className="sr-only">
              {etapa.titulo}
              {indice < passo && ' (concluída)'}
              {indice === passo && ' (etapa atual)'}
            </span>
          </li>
        ))}
      </ol>

      <h2 className="mt-5 text-lg font-semibold text-slate-900">{titulo}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{resumo}</p>
    </div>
  )
}
