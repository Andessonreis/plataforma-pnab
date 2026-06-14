'use client'

import { useState } from 'react'

interface RecursoAnexosProps {
  urls: string[]
  inscricaoId: string
  recursoId: string
  scope: 'admin' | 'proponente'
}

export function RecursoAnexos({ urls, inscricaoId, recursoId, scope }: RecursoAnexosProps) {
  const [loading, setLoading] = useState<number | null>(null)

  async function abrir(index: number) {
    setLoading(index)
    try {
      const endpoint =
        scope === 'admin'
          ? `/api/admin/inscricoes/${inscricaoId}/recurso/${recursoId}/anexo?url=${encodeURIComponent(urls[index])}`
          : `/api/proponente/inscricoes/${inscricaoId}/recurso/anexos?recursoId=${recursoId}&url=${encodeURIComponent(urls[index])}`

      const res = await fetch(endpoint)
      const data = await res.json()

      if (!res.ok) {
        alert(data.message ?? 'Erro ao abrir anexo.')
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
    <ul className="space-y-1">
      {urls.map((_, index) => (
        <li key={index}>
          <button
            type="button"
            onClick={() => abrir(index)}
            disabled={loading === index}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {loading === index ? 'Abrindo…' : `Anexo ${index + 1}`}
          </button>
        </li>
      ))}
    </ul>
  )
}
