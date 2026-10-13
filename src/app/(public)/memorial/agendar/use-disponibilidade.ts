'use client'

import { useEffect, useState } from 'react'
import type { SituacaoHorario } from '@/lib/memorial/agendamento/regras'

/** Dias de visitação de um mês, cada um com a grade inteira e o motivo dos horários tomados. */
export type AgendaDoMes = Map<string, SituacaoHorario[]>

/** Agenda já consultada, por mês ("AAAA-MM"). Vive no fluxo, então sobrevive à troca de etapa. */
export type CacheAgenda = Map<string, AgendaDoMes>

type Estado =
  | { situacao: 'carregando' }
  | { situacao: 'erro'; mensagem: string }
  | { situacao: 'pronto'; dias: AgendaDoMes }

export function proximoMes(mes: string, n = 1) {
  const d = new Date(`${mes}-01T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 7)
}

async function buscarAgenda(mes: string, signal?: AbortSignal): Promise<AgendaDoMes> {
  const res = await fetch(`/api/v1/memorial/agendamentos/disponibilidade?mes=${mes}`, { signal, cache: 'no-store' })
  const corpo = await res.json()
  if (!res.ok) throw new Error(corpo.message)
  return new Map((corpo.data.dias as { data: string; horarios: SituacaoHorario[] }[]).map((d) => [d.data, d.horarios]))
}

/**
 * Agenda de um mês. O que já está no cache (inclusive o mês corrente, que a página
 * traz pronta do servidor) aparece na hora e é reconsultado em segundo plano, porque
 * a vaga pode ter sido tomada enquanto a pessoa lia as regras. Depois de carregar,
 * o mês seguinte é buscado de antemão para a seta de avançar não esperar.
 */
export function useDisponibilidade(mes: string, cache: CacheAgenda) {
  const [estado, setEstado] = useState<Estado>(() => {
    const guardado = cache.get(mes)
    return guardado ? { situacao: 'pronto', dias: guardado } : { situacao: 'carregando' }
  })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controle = new AbortController()
    const guardado = cache.get(mes)
    setEstado(guardado ? { situacao: 'pronto', dias: guardado } : { situacao: 'carregando' })

    buscarAgenda(mes, controle.signal)
      .then((dias) => {
        cache.set(mes, dias)
        setEstado({ situacao: 'pronto', dias })
        const seguinte = proximoMes(mes)
        if (!cache.has(seguinte)) buscarAgenda(seguinte).then((d) => cache.set(seguinte, d), () => undefined)
      })
      .catch((err: unknown) => {
        if (controle.signal.aborted || guardado) return
        setEstado({
          situacao: 'erro',
          mensagem: err instanceof Error && err.message ? err.message : 'Não foi possível carregar a agenda.',
        })
      })
    return () => controle.abort()
  }, [mes, versao, cache])

  return { estado, recarregar: () => setVersao((v) => v + 1) }
}
