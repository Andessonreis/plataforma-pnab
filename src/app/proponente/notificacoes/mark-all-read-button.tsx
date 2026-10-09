'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { BotaoCarregando } from '../_componentes/botao-carregando'
import { botaoContorno } from '../estilos'

export function MarkAllReadButton({ naoLidas }: { naoLidas: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/proponente/notifications/read-all', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: data.message ?? 'Não foi possível marcar os avisos como lidos.' })
        return
      }
      toast({ title: data.updated === 1 ? '1 aviso marcado como lido' : `${data.updated} avisos marcados como lidos` })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <BotaoCarregando
      id="tour-notificacoes-marcar-lidas"
      type="button"
      onClick={handleClick}
      carregando={loading}
      estilo={botaoContorno}
    >
      Marcar {naoLidas === 1 ? 'como lido' : 'todos como lidos'}
    </BotaoCarregando>
  )
}
