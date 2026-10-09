'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { MemorialTurno } from '@prisma/client'
import { Aviso, Button, Input, Select } from '@/components/ui'
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
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {salvo && <Aviso tom="sucesso">Visita remarcada. O responsável foi avisado por e-mail.</Aviso>}
        <Button type="button" variant="ghost" className="mt-1 w-full" onClick={() => setAberto(true)}>
          Remarcar data ou horário
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={salvar} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Remarcar visita</h2>
      <Input id="reagendar-data" label="Nova data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
      <Select id="reagendar-horario" label="Horário" options={opcoes} value={horario} onChange={(e) => setHorario(e.target.value)} required />
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" loading={enviando} className="flex-1">
          Remarcar e avisar
        </Button>
        <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
