'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@client/components/ui'
import { toast } from '@client/hooks/use-toast'

interface ActionButtonsProps {
  campaignId: string
  campaignTitle: string
  status: 'RASCUNHO' | 'ENVIANDO' | 'ENVIADA' | 'CANCELADA' | 'FALHA'
  totalEnviado: number
}

export function CampaignActionButtons({
  campaignId,
  campaignTitle,
  status,
  totalEnviado,
}: ActionButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const canDelete = status === 'RASCUNHO' || status === 'FALHA'
  const canCancel = status === 'ENVIANDO' && totalEnviado === 0

  async function handleDelete() {
    if (!window.confirm(`Excluir campanha "${campaignTitle}"? Esta ação não pode ser desfeita.`)) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notifications/campaigns/${campaignId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: data.message ?? 'Erro ao excluir' })
        return
      }
      router.push('/admin/notificacoes/campanhas')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancelar disparo desta campanha?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notifications/campaigns/${campaignId}/cancel`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'destructive', title: data.message ?? 'Erro ao cancelar' })
        return
      }
      toast({ title: 'Campanha cancelada.' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {canCancel && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          loading={loading}
          className="text-amber-700 hover:bg-amber-50"
        >
          Cancelar disparo
        </Button>
      )}
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleDelete}
          loading={loading}
          className="text-red-600 hover:bg-red-50"
        >
          Excluir
        </Button>
      )}
    </div>
  )
}
