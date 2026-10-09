'use client'

import { ROTULO_TURNO } from '@/lib/memorial/agendamento/status'
import { TURNOS } from '@/lib/memorial/agendamento/regras'
import type { HorarioLivre } from './use-disponibilidade'

interface HorariosDoDiaProps {
  titulo: string
  horarios: HorarioLivre[]
  escolhido: string
  aoEscolher: (h: HorarioLivre) => void
}

/** Horários livres do dia escolhido, separados por turno, como botões de opção nativos. */
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
                const ativo = h.inicio === escolhido
                return (
                  <label
                    key={h.inicio}
                    className={[
                      'flex min-h-[48px] cursor-pointer items-center justify-center border-2 px-2 text-sm font-semibold transition-colors',
                      'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-turquesa-700',
                      ativo ? 'border-turquesa-800 bg-turquesa-800 text-white' : 'border-tinta-900/20 text-tinta-900 hover:border-tinta-900',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="horario"
                      value={h.inicio}
                      checked={ativo}
                      onChange={() => aoEscolher(h)}
                      className="sr-only"
                    />
                    {h.inicio} às {h.fim}
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
