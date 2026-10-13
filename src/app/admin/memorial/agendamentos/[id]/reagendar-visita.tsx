'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { MemorialTurno } from '@prisma/client'
import { Aviso } from '@/components/ui'
import { botaoNeutro, botaoPrimario, campo, linkDiscreto, rotuloCampo } from '@/app/admin/memorial/_ui'
import { ROTULO_TURNO } from '@/lib/memorial/agendamento/status'
import { TURNOS } from '@/lib/memorial/agendamento/regras'
import type { Visitacao } from '@/lib/memorial/config'

interface ReagendarVisitaProps {
  id: string
  atual: { data: string; turno: MemorialTurno; horaInicio: string }
  horarios: Visitacao['horarios']
}

/**
 * Remarcação pela equipe. A grade vem da configuração; o servidor confere de novo se o
 * horário está livre e se cabe na regra de turno.
 */
export function ReagendarVisita({ id, atual, horarios }: ReagendarVisitaProps) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [data, setData] = useState(atual.data)
  const [horario, setHorario] = useState(`${atual.turno}|${atual.horaInicio}`)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)

  const opcoes = TURNOS.flatMap((turno) =>
    horarios[turno].map((h) => ({ value: `${turno}|${h.inicio}`, label: `${ROTULO_TURNO[turno]}, ${h.inicio} às ${h.fim}` })),
  )

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const [turno, horaInicio] = horario.split('|') as [MemorialTurno, string]
    const horaFim = horarios[turno].find((h) => h.inicio === horaInicio)?.fim
    if (!data || !horaFim) return setErro('Escolha a nova data e o horário.')

    setEnviando(true)
    setErro('')
    const res = await fetch(`/api/v1/memorial/agendamentos/${id}/reagendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, turno, horaInicio, horaFim }),
    }).catch(() => null)
    setEnviando(false)
    if (!res?.ok) {
      const corpo = await res?.json().catch(() => null)
      return setErro(corpo?.message ?? 'Não foi possível remarcar. Tente de novo.')
    }
    setSalvo(true)
    setAberto(false)
    router.refresh()
  }

  if (!aberto) {
    return (
      <div className="space-y-2 border-t border-tinta-900/10 pt-4">
        {salvo && <Aviso tom="sucesso">Visita remarcada. O responsável foi avisado por e-mail.</Aviso>}
        <button type="button" className={`${botaoNeutro} w-full`} onClick={() => setAberto(true)}>
          Remarcar data ou horário
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={salvar} className="space-y-3 border-t border-tinta-900/10 pt-4">
      <h3 className="text-sm font-bold text-tinta-900">Remarcar visita</h3>
      <label className="block">
        <span className={rotuloCampo}>Nova data</span>
        <input id="reagendar-data" type="date" value={data} onChange={(e) => setData(e.target.value)} required className={campo} />
      </label>
      <label className="block">
        <span className={rotuloCampo}>Horário</span>
        <select id="reagendar-horario" value={horario} onChange={(e) => setHorario(e.target.value)} required className={campo}>
          {opcoes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={enviando} className={`${botaoPrimario} flex-1`}>
          {enviando ? 'Remarcando...' : 'Remarcar e avisar'}
        </button>
        <button type="button" onClick={() => setAberto(false)} className={`${linkDiscreto} min-h-[44px]`}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
