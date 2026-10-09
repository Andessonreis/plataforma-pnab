'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ACOES_COM_MOTIVO, type AcaoVisita } from '@/lib/memorial/agendamento/status'

/**
 * Estado e envio de uma decisão sobre a visita. Recusar e cancelar pedem o motivo antes
 * de enviar, porque o texto vai no e-mail ao responsável. Usado no detalhe e nos cartões
 * da visão geral, para as duas telas responderem do mesmo jeito.
 */
export function useDecisaoVisita(id: string) {
  const router = useRouter()
  const [pendente, setPendente] = useState<AcaoVisita | null>(null)
  const [motivo, setMotivo] = useState('')
  const [emCurso, setEmCurso] = useState<AcaoVisita | null>(null)
  const [erro, setErro] = useState('')

  async function executar(acao: AcaoVisita) {
    if (ACOES_COM_MOTIVO.includes(acao) && pendente !== acao) {
      setPendente(acao)
      setErro('')
      return
    }
    if (ACOES_COM_MOTIVO.includes(acao) && !motivo.trim()) return setErro('Escreva o motivo que será enviado ao responsável.')

    setEmCurso(acao)
    setErro('')
    const res = await fetch(`/api/v1/memorial/agendamentos/${id}/decisao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, motivo: motivo.trim() || undefined }),
    }).catch(() => null)
    setEmCurso(null)
    if (!res?.ok) {
      const corpo = await res?.json().catch(() => null)
      return setErro(corpo?.message ?? 'Não foi possível salvar. Tente de novo.')
    }
    setPendente(null)
    setMotivo('')
    router.refresh()
  }

  function desistir() {
    setPendente(null)
    setErro('')
  }

  return { pendente, motivo, setMotivo, emCurso, erro, executar, desistir }
}
