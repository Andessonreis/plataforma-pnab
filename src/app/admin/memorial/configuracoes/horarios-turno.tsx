'use client'

import { IconClose, IconPlus } from '@/components/ui'
import { botaoNeutro } from '@/app/admin/memorial/_ui'
import { proximaFaixa, resumoTurno, type Horario } from './regras-visita'

interface Props {
  turno: string
  /** Onde começa a primeira faixa quando o turno está vazio. */
  inicioPadrao: string
  horarios: Horario[]
  onChange: (h: Horario[]) => void
  erro?: string
}

const hora =
  'min-h-[44px] w-full min-w-0 max-w-[9rem] rounded-lg border border-tinta-900/20 bg-white px-2 text-sm tabular-nums text-tinta-900 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500'

/** Faixas de horário de um turno, oferecidas a quem pede visita. Cada linha é um horário que o público pode escolher. */
export function HorariosTurno({ turno, inicioPadrao, horarios, onChange, erro }: Props) {
  const mudar = (i: number, campo: keyof Horario, valor: string) =>
    onChange(horarios.map((h, j) => (j === i ? { ...h, [campo]: valor } : h)))
  const resumo = resumoTurno(horarios)

  return (
    <fieldset className="rounded-xl border border-tinta-900/10 bg-papel-50/60 p-3 sm:p-4">
      <legend className="sr-only">{turno}</legend>
      <div aria-hidden="true" className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-tinta-900">{turno}</span>
        <span className="text-sm font-medium text-tinta-700">{resumo ? `${horarios.length} horários, ${resumo}` : 'Sem visitas'}</span>
      </div>
      <ul className="space-y-2">
        {horarios.map((h, i) => (
          <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 sm:flex">
            <input type="time" aria-label={`${turno}, horário ${i + 1}, começa`} value={h.inicio} onChange={(e) => mudar(i, 'inicio', e.target.value)} className={hora} />
            <span className="text-sm text-tinta-600">às</span>
            <input type="time" aria-label={`${turno}, horário ${i + 1}, termina`} value={h.fim} onChange={(e) => mudar(i, 'fim', e.target.value)} className={hora} />
            <button
              type="button"
              aria-label={`Tirar o horário das ${h.inicio} (${turno.toLowerCase()})`}
              onClick={() => onChange(horarios.filter((_, j) => j !== i))}
              className="inline-flex h-11 w-11 sm:ml-auto shrink-0 items-center justify-center rounded-lg text-tinta-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-accent-500"
            >
              <IconClose className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
      {horarios.length === 0 && <p className="text-sm text-tinta-700">Ninguém consegue pedir visita neste turno.</p>}
      {erro && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{erro}</p>}
      <button type="button" className={`${botaoNeutro} mt-3 w-full sm:w-auto`} onClick={() => onChange([...horarios, proximaFaixa(horarios, inicioPadrao)])}>
        <IconPlus className="h-4 w-4" />
        Adicionar horário
      </button>
    </fieldset>
  )
}
