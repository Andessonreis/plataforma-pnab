'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

interface Props {
  editalId: string
}

/** Baixa a classificação por categoria em PDF, no layout que vai para o Diário. */
export function BaixarClassificacao({ editalId }: Props) {
  const [loading, setLoading] = useState(false)

  async function baixar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/editais/${editalId}/classificacao`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ variant: 'destructive', title: data.message ?? 'Não foi possível gerar o PDF.' })
        return
      }
      const blob = await res.blob()
      const nome = res.headers.get('Content-Disposition')?.match(/filename="(.+?)"/)?.[1] ?? 'classificacao.pdf'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nome
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível gerar o PDF.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={baixar} loading={loading} variant="secondary" size="sm">
      Baixar classificação (PDF)
    </Button>
  )
}
