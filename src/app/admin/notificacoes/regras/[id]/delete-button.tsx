'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@client/components/ui'
import { toast } from '@client/hooks/use-toast'

interface DeleteRuleButtonProps {
  ruleId: string
  ruleName: string
}

export function DeleteRuleButton({ ruleId, ruleName }: DeleteRuleButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (
      !window.confirm(
        `Excluir regra "${ruleName}"? Esta ação não pode ser desfeita. Campanhas já geradas ficam preservadas no histórico.`,
      )
    ) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/notificacoes/regras/regra/${ruleId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: json.message ?? 'Erro' })
        return
      }
      router.push('/admin/notificacoes/regras')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleDelete}
      loading={loading}
      className="text-red-600 hover:bg-red-50"
    >
      Excluir
    </Button>
  )
}
