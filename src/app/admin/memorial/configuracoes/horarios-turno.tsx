'use client'

import { Button } from '@/components/ui'

type Horario = { inicio: string; fim: string }

interface HorariosTurnoProps {
  turno: string
  horarios: Horario[]
  onChange: (h: Horario[]) => void
  erro?: string
}

const CAMPO = 'min-h-[44px] rounded-lg border border-slate-300 px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200'

/** Faixas de horário de um turno (ex.: 09:00 às 09:45), oferecidas no agendamento. */
export function HorariosTurno({ turno, horarios, onChange, erro }: HorariosTurnoProps) {
  function mudar(i: number, campo: keyof Horario, valor: string) {
    onChange(horarios.map((h, j) => (j === i ? { ...h, [campo]: valor } : h)))
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">{turno}</legend>
      <ul className="space-y-2">
        {horarios.map((h, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <input type="time" aria-label={`${turno}, faixa ${i + 1}, início`} value={h.inicio} onChange={(e) => mudar(i, 'inicio', e.target.value)} className={CAMPO} />
            <span className="text-sm text-slate-600">às</span>
            <input type="time" aria-label={`${turno}, faixa ${i + 1}, fim`} value={h.fim} onChange={(e) => mudar(i, 'fim', e.target.value)} className={CAMPO} />
            <button
              type="button"
              onClick={() => onChange(horarios.filter((_, j) => j !== i))}
              className="min-h-[44px] px-2 text-sm text-slate-600 underline underline-offset-4 hover:text-red-700"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
      {horarios.length === 0 && <p className="text-sm text-slate-500">Sem visitas neste turno.</p>}
      {erro && <p className="text-sm text-red-700">{erro}</p>}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-[44px]"
        onClick={() => onChange([...horarios, { inicio: horarios.at(-1)?.fim ?? '09:00', fim: horarios.at(-1)?.fim ?? '09:45' }])}
      >
        Adicionar horário
      </Button>
    </fieldset>
  )
}
