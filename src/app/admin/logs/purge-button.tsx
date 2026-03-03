'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'

interface PurgeButtonProps {
  retentionDays: number
}

export function PurgeButton({ retentionDays }: PurgeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handlePurge() {
    const confirmed = window.confirm(
      `Deseja remover logs com mais de ${retentionDays} dias? Esta ação é irreversível.`,
    )
    if (!confirmed) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/logs/purge', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setResult(`${data.removidos} log(s) removido(s).`)
        router.refresh()
      } else {
        setResult(data.message || 'Erro ao executar limpeza.')
      }
    } catch {
      setResult('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-slate-600">{result}</span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={loading}
        onClick={handlePurge}
        aria-label={`Remover logs com mais de ${retentionDays} dias`}
      >
        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        Limpar antigos
      </Button>
    </div>
  )
}
