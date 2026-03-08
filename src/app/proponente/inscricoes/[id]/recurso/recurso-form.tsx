'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface RecursoFormProps {
  inscricaoId: string
  fase: string
  onSuccess?: () => void
}

export function RecursoForm({ inscricaoId, fase, onSuccess }: RecursoFormProps) {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/proponente/inscricoes/${inscricaoId}/recurso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase, texto, urlAnexos: [] }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Erro ao submeter recurso.')
        return
      }

      setSuccess(true)
      onSuccess?.()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">
          Recurso submetido com sucesso! Acompanhe o resultado pela sua área.
        </p>
      </div>
    )
  }

  const faseLabels: Record<string, string> = {
    HABILITACAO: 'Habilitação',
    RESULTADO_PRELIMINAR: 'Resultado Preliminar',
    RESULTADO_FINAL: 'Resultado Final',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Interpor Recurso
        </h3>
        <p className="text-sm text-slate-500">
          Fase: <strong>{faseLabels[fase] ?? fase}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="recurso-texto" className="block text-sm font-medium text-slate-700 mb-1">
          Fundamentação do recurso *
        </label>
        <textarea
          id="recurso-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          minLength={20}
          maxLength={5000}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          placeholder="Descreva os fundamentos do seu recurso, apresentando argumentos e evidências que justifiquem a revisão da decisão..."
        />
        <p className="text-xs text-slate-400 mt-1">
          {texto.length}/5000 caracteres (mínimo 20)
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || texto.length < 20}
          variant="primary"
        >
          {loading ? 'Enviando...' : 'Submeter Recurso'}
        </Button>
        <p className="text-xs text-slate-400">
          Após envio, o recurso será analisado pela comissão responsável.
        </p>
      </div>
    </form>
  )
}
