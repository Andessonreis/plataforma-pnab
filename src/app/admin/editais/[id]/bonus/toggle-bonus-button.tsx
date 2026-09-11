'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

interface Props {
  editalId: string
  visivel: boolean
}

/** SUPER_ADMIN-only — libera/revoga o acesso do ADMIN comum a este painel. */
export function ToggleBonusButton({ editalId, visivel }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (visivel && !window.confirm('Revogar o acesso dos admins comuns a este painel?')) return
    if (!visivel && !window.confirm('Liberar este painel de nota bônus pros admins comuns deste edital?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/editais/${editalId}/bonus/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visivel: !visivel }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: data.message ?? 'Erro ao atualizar' })
        return
      }
      toast({ title: data.bonusVisivelParaAdmin ? 'Liberado pros admins' : 'Revogado dos admins' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleToggle} loading={loading} variant={visivel ? 'ghost' : 'primary'} size="sm">
      {visivel ? 'Revogar acesso dos admins' : 'Liberar pros admins'}
    </Button>
  )
}
