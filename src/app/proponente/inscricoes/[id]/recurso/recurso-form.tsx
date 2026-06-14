'use client'

import { useState } from 'react'
import { Button } from '@client/components/ui'
import { recursosClient } from '@client/api/recursos.client'
import type { SubmeterRecursoInput } from '@shared/schemas/recursos.schema'

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

interface AnexoLocal {
  file: File
  url?: string
  status: 'pendente' | 'enviando' | 'ok' | 'erro'
  error?: string
}

const ALLOWED_MIMES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ARQUIVOS = 5

export function RecursoForm({ inscricaoId, fase, contexto, onSuccess }: RecursoFormProps) {
  const [texto, setTexto] = useState('')
  const [anexos, setAnexos] = useState<AnexoLocal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list)
    if (arr.length === 0) return
    setError(null)
    // Respeita o limite total
    const livres = MAX_ARQUIVOS - anexos.length
    if (livres <= 0) {
      setError(`Máximo de ${MAX_ARQUIVOS} evidências por recurso.`)
      return
    }
    const toAdd = arr.slice(0, livres).map<AnexoLocal>((file) => {
      if (file.size > MAX_FILE_SIZE) {
        return { file, status: 'erro', error: 'Excede 10MB' }
      }
      if (!ALLOWED_MIMES.includes(file.type)) {
        return { file, status: 'erro', error: 'Formato não permitido' }
      }
      return { file, status: 'pendente' }
    })
    setAnexos((prev) => [...prev, ...toAdd])
  }

  const removeAnexo = (i: number) => {
    setAnexos((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1) Upload das evidências pendentes
      const urls: string[] = []
      const nextAnexos = [...anexos]
      for (let i = 0; i < nextAnexos.length; i++) {
        const a = nextAnexos[i]
        if (a.status === 'ok' && a.url) {
          urls.push(a.url)
          continue
        }
        if (a.status === 'erro') continue
        nextAnexos[i] = { ...a, status: 'enviando' }
        setAnexos([...nextAnexos])
        try {
          const { url } = await recursosClient.uploadAnexo(inscricaoId, a.file)
          nextAnexos[i] = { ...a, status: 'ok', url }
          setAnexos([...nextAnexos])
          urls.push(url)
        } catch (upErr) {
          const msg = upErr instanceof Error ? upErr.message : 'Falha no envio'
          nextAnexos[i] = { ...a, status: 'erro', error: msg }
          setAnexos([...nextAnexos])
          setError(`Falha ao enviar "${a.file.name}": ${msg}`)
          setLoading(false)
          return
        }
      }

      // 2) Submete o recurso com as URLs das evidências
      await recursosClient.submit(inscricaoId, {
        fase: fase as SubmeterRecursoInput['fase'],
        texto,
        urlAnexos: urls,
      })

      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão. Tente novamente.')
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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

      {/* Contexto do recurso (equivalente ao topo do Anexo 07 — preenchido automaticamente) */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dados do pedido</p>
        <p><span className="text-slate-500">Entidade:</span> <span className="font-medium text-slate-900">{contexto.entidadeNome}</span></p>
        <p><span className="text-slate-500">Projeto:</span> <span className="font-medium text-slate-900">{contexto.projetoNome}</span></p>
        <p><span className="text-slate-500">Responsável legal:</span> <span className="font-medium text-slate-900">{contexto.responsavelNome}</span></p>
        <p className="text-xs text-slate-400 pt-1">Estas informações serão registradas como parte do seu recurso junto com a data de envio (equivale ao preenchimento manual do Anexo 07).</p>
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
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          placeholder="Descreva os fundamentos do seu recurso, apresentando argumentos e evidências que justifiquem a revisão da decisão..."
        />
        <p className="text-xs text-slate-400 mt-1">
          {texto.length}/5000 caracteres (mínimo 20)
        </p>
      </div>

      {/* Evidências (urlAnexos) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Evidências (opcional)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Anexe documentos que comprovem seus argumentos (PDF, PNG ou JPEG — até 10MB cada, máx. {MAX_ARQUIVOS} arquivos).
        </p>
        <label className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 cursor-pointer hover:border-brand-400 hover:text-brand-700 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Adicionar arquivo(s)
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
            disabled={loading || anexos.length >= MAX_ARQUIVOS}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files)
              e.target.value = ''
            }}
            className="hidden"
          />
        </label>

        {anexos.length > 0 && (
          <ul className="mt-2 space-y-1.5" role="list">
            {anexos.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm">
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="truncate text-slate-800">{a.file.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatSize(a.file.size)}</span>
                  {a.status === 'enviando' && <span className="text-xs text-amber-600 shrink-0">enviando…</span>}
                  {a.status === 'ok' && <span className="text-xs text-green-700 shrink-0">✓ enviado</span>}
                  {a.status === 'erro' && <span className="text-xs text-red-600 shrink-0">✗ {a.error}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => removeAnexo(i)}
                  disabled={loading}
                  className="text-slate-400 hover:text-red-600 text-xs font-medium px-2 disabled:opacity-50"
                  aria-label={`Remover ${a.file.name}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
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
