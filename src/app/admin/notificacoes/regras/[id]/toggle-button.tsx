'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

interface ToggleRuleButtonProps {
  ruleId: string
  ativo: boolean
  implementado: boolean
}

export function ToggleRuleButton({ ruleId, ativo, implementado }: ToggleRuleButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (!ativo && !implementado) {
      toast({
        variant: 'destructive',
        title: 'Trigger ainda não implementado',
        description: 'Aguardando implementação no código.',
      })
      return
    }

    if (!ativo) {
      if (!window.confirm('Ativar esta regra? Ela começará a disparar automaticamente a partir de agora.')) {
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notifications/rules/${ruleId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: data.message ?? 'Erro' })
        return
      }
      toast({ title: data.ativo ? 'Regra ativada' : 'Regra desativada' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      loading={loading}
      variant={ativo ? 'ghost' : 'primary'}
      className={ativo ? 'text-amber-700 hover:bg-amber-50' : ''}
      disabled={!ativo && !implementado}
    >
      {ativo ? 'Desativar' : 'Ativar'}
    </Button>
  )
}
