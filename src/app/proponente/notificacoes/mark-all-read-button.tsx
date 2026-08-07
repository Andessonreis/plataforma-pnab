'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, IconCheckSimple } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

export function MarkAllReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/proponente/notifications/read-all', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: data.message ?? 'Erro' })
        return
      }
      toast({ title: `${data.updated} notificação(ões) marcada(s) como lida(s)` })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      id="tour-notificacoes-marcar-lidas"
      onClick={handleClick}
      loading={loading}
      variant="ghost"
      size="sm"
      className="shrink-0"
    >
      <IconCheckSimple className="h-4 w-4 mr-1.5" />
      <span className="hidden sm:inline">Marcar todas como lidas</span>
      <span className="sm:hidden">Marcar lidas</span>
    </Button>
  )
}
