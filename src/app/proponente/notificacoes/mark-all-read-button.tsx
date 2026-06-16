'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@client/components/ui'
import { toast } from '@client/hooks/use-toast'

export function MarkAllReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/notificacoes/me/lidas', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: json.message ?? 'Erro' })
        return
      }
      toast({ title: `${json.data.updated} notificação(ões) marcada(s) como lida(s)` })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} loading={loading} variant="ghost" size="sm">
      Marcar todas como lidas
    </Button>
  )
}
