'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@client/components/ui'
import { recursosClient } from '@client/api/recursos.client'

interface RecursoRespostaAvaliadorProps {
  inscricaoId: string
  recursoId: string
  fase: string
  initialDecisao?: 'DEFERIDO' | 'INDEFERIDO' | null
  initialJustificativa?: string
}

export function RecursoRespostaAvaliador({
  inscricaoId,
  recursoId,
  fase,
  initialDecisao = null,
  initialJustificativa = '',
}: RecursoRespostaAvaliadorProps) {
  const router = useRouter()
  const [decisao, setDecisao] = useState<'DEFERIDO' | 'INDEFERIDO' | null>(initialDecisao)
  const [justificativa, setJustificativa] = useState(initialJustificativa)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!decisao) return

    setLoading(true)
    setError(null)

    try {
      await recursosClient.respond(inscricaoId, recursoId, { decisao, justificativa })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-slate-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-slate-900">
        {initialDecisao ? 'Revisar sua resposta' : 'Responder recurso'} — Fase: {fase}
      </h4>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setDecisao('DEFERIDO')}
          className={[
            'flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-colors',
            decisao === 'DEFERIDO'
              ? 'border-green-500 bg-green-50 text-green-800'
              : 'border-slate-200 text-slate-600 hover:border-green-300',
          ].join(' ')}
        >
          Deferir
        </button>
        <button
          type="button"
          onClick={() => setDecisao('INDEFERIDO')}
          className={[
            'flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-colors',
            decisao === 'INDEFERIDO'
              ? 'border-red-500 bg-red-50 text-red-800'
              : 'border-slate-200 text-slate-600 hover:border-red-300',
          ].join(' ')}
        >
          Indeferir
        </button>
      </div>

      <div>
        <label htmlFor={`justificativa-${recursoId}`} className="block text-sm font-medium text-slate-700 mb-1">
          Justificativa *
        </label>
        <textarea
          id={`justificativa-${recursoId}`}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          rows={4}
          minLength={10}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          placeholder="Fundamentação do seu parecer..."
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !decisao || justificativa.length < 10}
        variant="primary"
      >
        {loading ? 'Enviando...' : initialDecisao ? 'Atualizar resposta' : 'Enviar resposta'}
      </Button>
    </form>
  )
}
