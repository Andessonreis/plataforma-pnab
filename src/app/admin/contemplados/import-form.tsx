'use client'

import { useState, useRef } from 'react'
import { Button, Card, Badge, Select } from '@/components/ui'

interface ImportFormProps {
  editais: Array<{ id: string; titulo: string }>
}

interface ImportError {
  line: number
  numero: string
  error: string
}

interface ImportResult {
  imported: number
  errors: ImportError[]
  message: string
}

export function ImportForm({ editais }: ImportFormProps) {
  const [selectedEditalId, setSelectedEditalId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    setErrorMessage('')

    if (!selectedEditalId) {
      setErrorMessage('Selecione um edital.')
      return
    }

    if (!file) {
      setErrorMessage('Selecione um arquivo CSV.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('editalId', selectedEditalId)

      const response = await fetch('/api/admin/contemplados/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || 'Erro ao importar arquivo.')
        return
      }

      setResult({
        imported: data.imported,
        errors: data.errors ?? [],
        message: data.message,
      })

      // Limpar formulario apos sucesso
      if (data.imported > 0) {
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch {
      setErrorMessage('Erro de conexao. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null
    setFile(selectedFile)
    setResult(null)
    setErrorMessage('')
  }

  const editalOptions = editais.map((e) => ({
    value: e.id,
    label: e.titulo,
  }))

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Importar CSV</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Selecao de edital */}
        <Select
          label="Edital"
          options={editalOptions}
          placeholder="Selecione um edital..."
          value={selectedEditalId}
          onChange={(e) => setSelectedEditalId(e.target.value)}
          required
        />

        {/* Upload de arquivo */}
        <div className="w-full">
          <label
            htmlFor="csv-file"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Arquivo CSV
            <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          </label>
          <input
            ref={fileInputRef}
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-900 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer file:min-h-[44px] file:transition-colors border border-slate-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-200 min-h-[44px]"
          />
          {file && (
            <p className="mt-1.5 text-sm text-slate-500">
              Arquivo selecionado: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Dica sobre formato */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Formato esperado do CSV:</p>
          <code className="block text-xs bg-white rounded px-3 py-2 border border-slate-200 text-slate-700 overflow-x-auto whitespace-pre">
{`numero;valorAprovado;statusExecucao;contrapartida
PNAB-2025-000001;50000.00;EM_EXECUCAO;Apresentacao publica
PNAB-2025-000002;30000.00;CONCLUIDO;Oficina comunitaria`}
          </code>
          <ul className="mt-2 text-xs text-slate-500 space-y-1">
            <li>Delimitador: <strong>ponto e virgula (;)</strong></li>
            <li>Codificacao: <strong>UTF-8</strong> (com ou sem BOM)</li>
            <li>Status validos: <strong>EM_EXECUCAO</strong>, <strong>CONCLUIDO</strong>, <strong>CANCELADO</strong>, <strong>SUSPENSO</strong></li>
            <li>Valor com ponto decimal (ex: 50000.00)</li>
          </ul>
        </div>

        {/* Mensagem de erro geral */}
        {errorMessage && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4" role="alert">
            <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Botao de envio */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading} disabled={!selectedEditalId || !file}>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar
          </Button>
        </div>
      </form>

      {/* Resultado da importacao */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Resumo */}
          <div className={`rounded-lg border p-4 ${result.errors.length === 0 ? 'bg-brand-50 border-brand-200' : 'bg-accent-50 border-accent-200'}`}>
            <div className="flex items-center gap-3 flex-wrap">
              {result.imported > 0 && (
                <Badge variant="success">
                  {result.imported} importado{result.imported !== 1 ? 's' : ''}
                </Badge>
              )}
              {result.errors.length > 0 && (
                <Badge variant="error">
                  {result.errors.length} erro{result.errors.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <p className="text-sm text-slate-700">{result.message}</p>
            </div>
          </div>

          {/* Detalhes dos erros */}
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                <h3 className="text-sm font-semibold text-red-800">Detalhes dos erros</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-100 text-left">
                      <th className="px-4 py-2 font-medium text-red-700">Linha</th>
                      <th className="px-4 py-2 font-medium text-red-700">Numero</th>
                      <th className="px-4 py-2 font-medium text-red-700">Erro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {result.errors.map((err, idx) => (
                      <tr key={idx} className="text-red-800">
                        <td className="px-4 py-2 font-mono">{err.line}</td>
                        <td className="px-4 py-2 font-mono">{err.numero}</td>
                        <td className="px-4 py-2">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
