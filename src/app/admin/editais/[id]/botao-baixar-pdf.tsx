'use client'

import { useState } from 'react'

interface BotaoBaixarPdfProps {
  url: string
  /** Nome usado quando a resposta não traz Content-Disposition. */
  nomePadrao: string
  rotulo: string
  ariaLabel: string
  /** Recebe a mensagem da falha, ou null quando uma nova tentativa começa. */
  onErro: (mensagem: string | null) => void
}

export function BotaoBaixarPdf({ url, nomePadrao, rotulo, ariaLabel, onErro }: BotaoBaixarPdfProps) {
  const [loading, setLoading] = useState(false)

  async function baixar() {
    if (loading) return
    setLoading(true)
    onErro(null)

    try {
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `Erro ${res.status}`)
      }

      const blobUrl = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? nomePadrao
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Revogar na hora pode cancelar o download em alguns navegadores.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (err) {
      console.error('Erro ao baixar PDF:', err)
      onErro(err instanceof Error ? err.message : 'Não foi possível gerar o documento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={baixar}
      disabled={loading}
      className={[
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
        'bg-brand-600 text-white hover:bg-brand-700',
        loading ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
      aria-label={ariaLabel}
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
      {rotulo}
    </button>
  )
}
