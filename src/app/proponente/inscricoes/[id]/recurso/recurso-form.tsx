'use client'

import { useState, type FormEvent } from 'react'
import { Button, IconCheck } from '@/components/ui'
import { useRecursoEvidencias, EvidenciaUploadError } from './use-recurso-evidencias'
import { RecursoContextSummary } from './recurso-context-summary'
import { RecursoEvidenciasField } from './recurso-evidencias-field'

interface Contexto {
  entidadeNome: string
  projetoNome: string
  responsavelNome: string
}

interface RecursoFormProps {
  inscricaoId: string
  fase: string
  contexto: Contexto
  onSuccess?: () => void
}

const FASE_LABELS: Record<string, string> = {
  HABILITACAO: 'Habilitação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RESULTADO_FINAL: 'Resultado Final',
}

export function RecursoForm({ inscricaoId, fase, contexto, onSuccess }: RecursoFormProps) {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { anexos, limiteError, addFiles, removeAnexo, uploadPendentes } = useRecursoEvidencias(inscricaoId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const urls = await uploadPendentes()

      const res = await fetch(`/api/proponente/inscricoes/${inscricaoId}/recurso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase, texto, urlAnexos: urls }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Erro ao submeter recurso.')
        return
      }

      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof EvidenciaUploadError ? err.message : 'Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-start gap-3">
        <IconCheck className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-brand-700">
          Recurso submetido com sucesso! Acompanhe o resultado pela sua área.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">Interpor Recurso</h3>
        <p className="text-sm text-slate-500">
          Fase: <strong className="text-slate-900 font-medium">{FASE_LABELS[fase] ?? fase}</strong>
        </p>
      </div>

      <RecursoContextSummary {...contexto} />

      {error && (
        <p className="text-sm text-red-700" role="alert">{error}</p>
      )}

      <div>
        <label htmlFor="recurso-texto" className="block text-sm font-medium text-slate-700 mb-1">
          Fundamentação do recurso *
        </label>
        <p className="text-xs text-slate-500 mb-2">
          &ldquo;À Comissão de Seleção, venho solicitar revisão do resultado da etapa pelos motivos abaixo...&rdquo;
        </p>
        <textarea
          id="recurso-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          minLength={20}
          maxLength={5000}
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          placeholder="Descreva os fundamentos do seu recurso, apresentando argumentos e evidências que justifiquem a revisão da decisão..."
        />
        <p className="text-xs text-slate-500 mt-1">{texto.length}/5000 caracteres (mínimo 20)</p>
      </div>

      <RecursoEvidenciasField
        anexos={anexos}
        limiteError={limiteError}
        loading={loading}
        onAddFiles={addFiles}
        onRemove={removeAnexo}
      />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading || texto.length < 20} variant="primary">
          {loading ? 'Enviando...' : 'Submeter Recurso'}
        </Button>
        <p className="text-xs text-slate-500">
          Após envio, o recurso será analisado pela comissão responsável.
        </p>
      </div>
    </form>
  )
}
