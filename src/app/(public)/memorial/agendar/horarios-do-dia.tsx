'use client'

import { ROTULO_TURNO } from '@/lib/memorial/agendamento/status'
import { TURNOS, rotuloMotivoHorario, type Horario, type SituacaoHorario } from '@/lib/memorial/agendamento/regras'

interface HorariosDoDiaProps {
  titulo: string
  horarios: SituacaoHorario[]
  escolhido: string
  aoEscolher: (h: Horario) => void
}

const FOCO = 'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-turquesa-700'

/**
 * Grade inteira do dia escolhido, por turno. Os horários livres são botões de opção
 * nativos; os indisponíveis continuam à vista, desabilitados e com o motivo curto,
 * para a pessoa entender por que não pode escolhê-los.
 */
export function HorariosDoDia({ titulo, horarios, escolhido, aoEscolher }: HorariosDoDiaProps) {
  return (
    <fieldset className="mt-6 border-t-2 border-tinta-900/15 pt-5">
      <legend className="text-base font-semibold text-tinta-900">Horários em {titulo}</legend>
      {TURNOS.map((turno) => {
        const doTurno = horarios.filter((h) => h.turno === turno)
        if (doTurno.length === 0) return null
        return (
          <div key={turno} className="mt-4">
            <p className="text-sm text-tinta-700">{ROTULO_TURNO[turno]}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {doTurno.map((h) => {
                const livre = h.motivo === null
                const ativo = livre && h.inicio === escolhido
                return (
                  <label
                    key={h.inicio}
                    className={[
                      'flex min-h-[52px] flex-col items-center justify-center border-2 px-2 py-1 text-center text-sm',
                      livre ? `cursor-pointer font-semibold ${FOCO}` : 'cursor-not-allowed border-dashed border-tinta-900/20 bg-papel-100/60 text-tinta-600',
                      ativo ? 'border-turquesa-800 bg-turquesa-800 text-white' : livre ? 'border-tinta-900/30 text-tinta-900 hover:border-tinta-900' : '',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="horario"
                      value={h.inicio}
                      checked={ativo}
                      disabled={!livre}
                      aria-disabled={!livre || undefined}
                      onChange={() => aoEscolher({ turno: h.turno, inicio: h.inicio, fim: h.fim })}
                      className="sr-only"
                    />
                    <span className={livre ? '' : 'line-through decoration-tinta-900/30'}>
                      {h.inicio} às {h.fim}
                    </span>
                    {h.motivo && <span className="text-xs">{rotuloMotivoHorario(h.motivo, h.turno)}</span>}
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </fieldset>
  )
}
