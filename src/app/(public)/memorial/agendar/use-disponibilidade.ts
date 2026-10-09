'use client'

import { useEffect, useState } from 'react'
import type { MemorialTurno } from '@prisma/client'

export interface HorarioLivre {
  turno: MemorialTurno
  inicio: string
  fim: string
}

type Estado =
  | { situacao: 'carregando' }
  | { situacao: 'erro'; mensagem: string }
  | { situacao: 'pronto'; dias: Map<string, HorarioLivre[]> }

/** Horários livres de um mês ("AAAA-MM"). Refaz a consulta quando o mês muda ou em `recarregar`. */
export function useDisponibilidade(mes: string) {
  const [estado, setEstado] = useState<Estado>({ situacao: 'carregando' })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controle = new AbortController()
    setEstado({ situacao: 'carregando' })
    fetch(`/api/v1/memorial/agendamentos/disponibilidade?mes=${mes}`, { signal: controle.signal })
      .then(async (res) => {
        const corpo = await res.json()
        if (!res.ok) throw new Error(corpo.message)
        const dias = new Map<string, HorarioLivre[]>(
          (corpo.data.dias as { data: string; horarios: HorarioLivre[] }[]).map((d) => [d.data, d.horarios]),
        )
        setEstado({ situacao: 'pronto', dias })
      })
      .catch((err: unknown) => {
        if (controle.signal.aborted) return
        setEstado({
          situacao: 'erro',
          mensagem: err instanceof Error && err.message ? err.message : 'Não foi possível carregar a agenda.',
        })
      })
    return () => controle.abort()
  }, [mes, versao])

  return { estado, recarregar: () => setVersao((v) => v + 1) }
}
