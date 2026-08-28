'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import type { MarcoEditavel } from '@/lib/utils/retificacao'
import type { Retificacao } from '@/types/retificacao'
import { RetificacaoCampos, type CamposRetificacao } from './retificacao-campos'
import { RetificacaoMarcos, type AlteracaoPendente } from './retificacao-marcos'
import { RetificacoesRegistradas } from './retificacao-registradas'

interface Props {
  editalId: string
  marcos: MarcoEditavel[]
  retificacoes: Retificacao[]
}

type Feedback = { type: 'success' | 'error'; text: string }

const CAMPOS_VAZIOS: CamposRetificacao = {
  numero: '',
  publicadoEm: '',
  resumo: '',
  diarioOficialUrl: '',
}

/**
 * Registro das retificações do edital.
 *
 * O painel só transcreve um ato que já saiu no Diário Oficial — é a publicação
 * que retifica o edital, não este formulário. Por isso número e data do Diário
 * são obrigatórios, e por isso nada aparece ao cidadão antes de alguém lançar
 * aqui: enquanto a Secretaria não publica, o portal continua mostrando o prazo
 * original, que é o que está valendo.
 */
export function RetificacaoPanel({ editalId, marcos, retificacoes }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [campos, setCampos] = useState<CamposRetificacao>(CAMPOS_VAZIOS)
  const [alteracoes, setAlteracoes] = useState<Record<number, AlteracaoPendente>>({})
  const [salvando, setSalvando] = useState(false)
  const [desfazendo, setDesfazendo] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  function alterarMarco(indice: number, valor: AlteracaoPendente | null) {
    setAlteracoes((atual) => {
      const proximo = { ...atual }
      if (valor === null) delete proximo[indice]
      else proximo[indice] = valor
      return proximo
    })
  }

  function limpar() {
    setCampos(CAMPOS_VAZIOS)
    setAlteracoes({})
  }

  async function registrar() {
    setSalvando(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/editais/${editalId}/retificacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: campos.numero.trim(),
          publicadoEm: campos.publicadoEm,
          resumo: campos.resumo.trim(),
          diarioOficialUrl: campos.diarioOficialUrl.trim(),
          alteracoes: Object.entries(alteracoes).map(([indice, valor]) => ({
            indice: Number(indice),
            ...valor,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.message ?? 'Não foi possível registrar a retificação.' })
        return
      }
      setFeedback({ type: 'success', text: data.message })
      limpar()
      setAberto(false)
      router.refresh()
    } catch {
      setFeedback({ type: 'error', text: 'Falha de conexão. Tente novamente.' })
    } finally {
      setSalvando(false)
    }
  }

  async function desfazer(numeroAto: string) {
    setDesfazendo(numeroAto)
    setFeedback(null)
    try {
      const res = await fetch(
        `/api/admin/editais/${editalId}/retificacao?numero=${encodeURIComponent(numeroAto)}`,
        { method: 'DELETE' },
      )
      const data = await res.json()
      setFeedback({
        type: res.ok ? 'success' : 'error',
        text: data.message ?? 'Não foi possível desfazer a retificação.',
      })
      if (res.ok) router.refresh()
    } catch {
      setFeedback({ type: 'error', text: 'Falha de conexão. Tente novamente.' })
    } finally {
      setDesfazendo(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border-2 border-red-300 bg-red-50">
      <div className="border-b border-red-300 bg-red-100 px-4 py-3">
        <h3 className="text-sm font-bold text-red-900">Retificações do edital</h3>
        <p className="mt-0.5 text-xs text-red-800">
          Lance aqui o que já foi publicado no Diário Oficial. O portal passa a mostrar a faixa
          vermelha e a riscar a data antiga ao lado da nova — antes disso, vale o prazo original.
        </p>
      </div>

      <div className="space-y-4 p-4">
        {feedback && (
          <div
            role="alert"
            className={`rounded-lg border px-3 py-2 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-white text-red-800'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <RetificacoesRegistradas
          retificacoes={retificacoes}
          onDesfazer={desfazer}
          desfazendo={desfazendo}
        />

        {!aberto ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setAberto(true)}>
            Registrar retificação
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-300 bg-white p-3">
            <RetificacaoCampos
              valores={campos}
              onChange={(campo, valor) => setCampos((atual) => ({ ...atual, [campo]: valor }))}
            />

            <RetificacaoMarcos
              marcos={marcos}
              alteracoes={alteracoes}
              onAlterar={alterarMarco}
              desabilitado={salvando}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={registrar} disabled={salvando}>
                {salvando ? 'Registrando…' : 'Registrar e publicar retificação'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setAberto(false); limpar(); setFeedback(null) }}
                disabled={salvando}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
