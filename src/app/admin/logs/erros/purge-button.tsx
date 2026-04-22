'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'

interface Props {
  retentionDays: number
  totalLogs: number
}

export function PurgeButton({ retentionDays, totalLogs }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handlePurge(force: boolean) {
    const msg = force
      ? `Remover TODOS os ${totalLogs} log(s) de erro? Esta ação é irreversível.`
      : `Remover logs de erro com mais de ${retentionDays} dias?`

    if (!window.confirm(msg)) return

    setLoading(true)
    setResult(null)
    try {
      const url = force ? '/api/admin/logs/erros/purge?force=true' : '/api/admin/logs/erros/purge'
      const res = await fetch(url, { method: 'POST' })
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
      {result && <span className="text-sm text-slate-600">{result}</span>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={loading}
        onClick={() => handlePurge(false)}
      >
        Limpar antigos (+{retentionDays}d)
      </Button>
      {totalLogs > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={loading}
          onClick={() => handlePurge(true)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Limpar tudo ({totalLogs})
        </Button>
      )}
    </div>
  )
}
