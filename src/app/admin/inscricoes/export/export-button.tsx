'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ExportButtonProps {
  total: number
}

export default function ExportButton({ total }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  function buildHref() {
    const params = new URLSearchParams()
    const editalId = searchParams.get('editalId')
    const status = searchParams.get('status')
    if (editalId) params.set('editalId', editalId)
    if (status) params.set('status', status)
    const qs = params.toString()
    return `/api/admin/inscricoes/export${qs ? `?${qs}` : ''}`
  }

  async function handleDownload() {
    if (total === 0) return
    setLoading(true)
    try {
      const href = buildHref()
      const res = await fetch(href)
      if (!res.ok) throw new Error('Erro ao gerar CSV')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inscricoes_pnab_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Erro ao gerar o arquivo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading || total === 0}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-emerald-700 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 min-h-[44px] transition-colors"
    >
      {loading ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Gerando...
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Exportar CSV
          {total > 0 && <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-xs font-semibold tabular-nums">{total}</span>}
        </>
      )}
    </button>
  )
}
