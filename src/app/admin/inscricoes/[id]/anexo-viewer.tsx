'use client'

import { useState } from 'react'

interface Anexo {
  id: string
  tipo: string
  titulo: string
  valido: boolean | null
  observacao: string | null
}

interface AnexoViewerProps {
  inscricaoId: string
  anexos: Anexo[]
}

export function AnexoViewer({ inscricaoId, anexos }: AnexoViewerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleView = async (anexoId: string) => {
    setLoading(anexoId)
    try {
      const res = await fetch(`/api/admin/inscricoes/${inscricaoId}/anexos?anexoId=${anexoId}`)
      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Erro ao abrir anexo.')
        return
      }

      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      alert('Erro ao abrir anexo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {anexos.map((anexo) => (
        <div key={anexo.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-lg">
          <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{anexo.titulo}</p>
            <p className="text-xs text-slate-500">{anexo.tipo}</p>
          </div>
          {anexo.valido !== null && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              anexo.valido
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {anexo.valido ? 'Válido' : 'Inválido'}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleView(anexo.id)}
            disabled={loading === anexo.id}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 min-h-[44px] px-2 shrink-0"
            aria-label={`Visualizar ${anexo.titulo}`}
          >
            {loading === anexo.id ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            Visualizar
          </button>
        </div>
      ))}
    </div>
  )
}
