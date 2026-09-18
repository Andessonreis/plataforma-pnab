'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

interface Props {
  editalId: string
  encerradaEm: string | null
}

/**
 * Fecha (ou reabre) o lançamento de nota pelos pareceristas. Enquanto estiver
 * aberto, quem já finalizou ainda consegue reabrir a própria avaliação e mudar
 * a nota — o que não pode acontecer com a Secretaria já conferindo bonificação
 * e montando a classificação.
 */
export function ToggleAvaliacaoButton({ editalId, encerradaEm }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const encerrada = encerradaEm !== null

  async function handleToggle() {
    const pergunta = encerrada
      ? 'Reabrir o lançamento de nota para os pareceristas deste edital?'
      : 'Encerrar o lançamento de nota? Os pareceristas deixam de lançar e de reabrir avaliação. A equipe da Secretaria continua editando.'
    if (!window.confirm(pergunta)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/editais/${editalId}/avaliacao/encerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encerrar: !encerrada }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: data.message ?? 'Não foi possível atualizar.' })
        return
      }
      const pendentes = data.avaliacoesNaoFinalizadas ?? 0
      toast({
        title: encerrada
          ? 'Avaliação reaberta para os pareceristas'
          : pendentes > 0
            ? `Avaliação encerrada — ${pendentes} avaliação(ões) ficaram sem finalizar`
            : 'Avaliação encerrada para os pareceristas',
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleToggle} loading={loading} variant={encerrada ? 'ghost' : 'secondary'} size="sm">
      {encerrada ? 'Reabrir avaliação' : 'Encerrar avaliação'}
    </Button>
  )
}
