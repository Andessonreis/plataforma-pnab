import type { RegrasPublicas } from './fluxo-agendamento'
import { BotoesEtapa } from './botoes-etapa'

interface EtapaRegrasProps {
  regras: RegrasPublicas
  regulamento: string
  aoContinuar: () => void
}

/** Primeira tela: os limites do agendamento e o regulamento, antes de qualquer campo. */
export function EtapaRegras({ regras, regulamento, aoContinuar }: EtapaRegrasProps) {
  const limites = [
    `Peça com pelo menos ${regras.antecedenciaHoras} horas de antecedência.`,
    `Cada pedido atende um grupo de até ${regras.maxPessoasPorGrupo} pessoas.`,
    `O Memorial recebe no máximo ${regras.maxGruposPorDia} ${regras.maxGruposPorDia === 1 ? 'grupo' : 'grupos'} por dia.`,
    ...(regras.umTurnoPorDia ? ['As visitas de um mesmo dia ficam todas de manhã ou todas de tarde.'] : []),
    'O horário só está garantido depois que a equipe confirmar por e-mail ou WhatsApp.',
  ]

  return (
    <div>
      <h2 className="titulo text-2xl text-tinta-900 sm:text-3xl">Antes de escolher a data</h2>

      <ul className="mt-5 space-y-3 text-base leading-relaxed text-tinta-800">
        {limites.map((l) => (
          <li key={l} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-oliva-700" />
            {l}
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-lg font-semibold text-tinta-900">Regulamento de visitação</h3>
      <div className="mt-3 max-w-prose whitespace-pre-line border-t-2 border-tinta-900/15 pt-4 text-[15px] leading-relaxed text-tinta-700">
        {regulamento}
      </div>

      <BotoesEtapa aoContinuar={aoContinuar} rotulo="Escolher data e horário" />
    </div>
  )
}
