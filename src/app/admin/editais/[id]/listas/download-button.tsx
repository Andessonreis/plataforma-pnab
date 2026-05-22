'use client'

import { useState } from 'react'
import { editaisClient } from '@client/api/editais.client'

interface DownloadButtonProps {
  editalId: string
  status: string
  format: 'pdf' | 'csv'
  label: string
  count: number
}

export function DownloadButton({ editalId, status, format, label, count }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  const disabled = count === 0 || loading

  async function handleDownload() {
    if (disabled) return
    setLoading(true)

    try {
      const url =
        format === 'pdf'
          ? editaisClient.listaPdfUrl(editalId, status)
          : `/api/admin/inscricoes/export?editalId=${editalId}&status=${status}`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Erro ${res.status}`)

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download =
        res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ??
        `lista_${status.toLowerCase()}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Erro ao baixar:', err)
      alert('Erro ao gerar o arquivo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isPdf = format === 'pdf'

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
        isPdf
          ? 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ].join(' ')}
      aria-label={`Baixar ${label} em ${format.toUpperCase()}`}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : isPdf ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {isPdf ? 'PDF' : 'CSV'}
    </button>
  )
}
