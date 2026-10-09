'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Aviso, Button, Textarea } from '@/components/ui'
import { ACOES_COM_MOTIVO, ROTULO_ACAO, type AcaoVisita } from '@/lib/memorial/agendamento/status'

const VARIANTE: Partial<Record<AcaoVisita, 'primary' | 'danger' | 'outline'>> = {
  CONFIRMAR: 'primary',
  RECUSAR: 'danger',
  CANCELAR: 'danger',
}

/**
 * Botões de decisão. Recusar e cancelar abrem o campo de motivo antes de enviar, porque
 * o texto vai no e-mail ao responsável.
 */
export function AcoesVisita({ id, acoes }: { id: string; acoes: AcaoVisita[] }) {
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">O que fazer com este pedido</h2>
      <div className="mt-3 flex flex-col gap-2">
        {acoes.map((acao) => (
          <Button
            key={acao}
            type="button"
            variant={VARIANTE[acao] ?? 'outline'}
            onClick={() => executar(acao)}
            loading={emCurso === acao}
            disabled={emCurso !== null}
            className="w-full"
          >
            {pendente === acao ? `${ROTULO_ACAO[acao]}: enviar` : ROTULO_ACAO[acao]}
          </Button>
        ))}
      </div>

      {pendente && (
        <div className="mt-4 space-y-2">
          <Textarea
            id="motivo-decisao"
            label={pendente === 'RECUSAR' ? 'Motivo da recusa' : 'Motivo do cancelamento'}
            hint="Vai no e-mail ao responsável."
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setPendente(null)}
            className="min-h-[44px] text-sm text-slate-600 underline underline-offset-2 hover:text-slate-900"
          >
            Desistir
          </button>
        </div>
      )}

      {erro && (
        <div className="mt-3">
          <Aviso tom="erro">{erro}</Aviso>
        </div>
      )}
    </div>
  )
}
