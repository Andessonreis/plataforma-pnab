'use client'

import { useState } from 'react'
import { editaisClient } from '@client/api/editais.client'

interface RelatorioFinalButtonProps {
  editalId: string
}

export function RelatorioFinalButton({ editalId }: RelatorioFinalButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(editaisClient.relatorioFinalUrl(editalId))
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `Erro ${res.status}`)
      }

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download =
        res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ??
        'relatorio-final.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Erro ao baixar relatório final:', err)
      alert('Erro ao gerar o relatório final. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={[
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
        'bg-brand-600 text-white hover:bg-brand-700',
        loading ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
      aria-label="Baixar Relatório Final em PDF"
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      Relatório Final
    </button>
  )
}
