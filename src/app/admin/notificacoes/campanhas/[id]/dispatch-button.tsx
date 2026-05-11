'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

interface DispatchButtonProps {
  campaignId: string
}

export function DispatchButton({ campaignId }: DispatchButtonProps) {
  const router = useRouter()
  const [previewing, setPreviewing] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handlePreview() {
    setPreviewing(true)
    try {
      const res = await fetch(`/api/admin/notifications/campaigns/${campaignId}/preview-audience`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro ao calcular audiência',
          description: data.message ?? 'Tente novamente.',
        })
        return
      }
      setPreviewCount(data.total)
      setShowConfirm(true)
    } finally {
      setPreviewing(false)
    }
  }

  async function handleConfirmSend() {
    setSending(true)
    try {
      const res = await fetch(`/api/admin/notifications/campaigns/${campaignId}/send`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro ao disparar',
          description: data.message ?? 'Tente novamente.',
        })
        return
      }
      toast({
        title: 'Campanha enfileirada',
        description: `${data.totalAlvo} destinatário(s) — entrega em andamento.`,
      })
      setShowConfirm(false)
      router.refresh()
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button onClick={handlePreview} loading={previewing}>
        Pré-visualizar audiência e disparar
      </Button>

      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirmar disparo</h3>
            {previewCount === 0 ? (
              <p className="text-sm text-slate-700">
                Nenhum usuário se encaixa no filtro. Revise a audiência antes de disparar.
              </p>
            ) : (
              <p className="text-sm text-slate-700">
                Esta campanha será entregue a{' '}
                <strong className="text-brand-700">{previewCount}</strong> usuário(s).
                <br />
                <span className="text-xs text-slate-500 mt-2 inline-block">
                  Esta ação não pode ser desfeita após a entrega começar.
                </span>
              </p>
            )}
            <div className="mt-5 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowConfirm(false)
                  setPreviewCount(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmSend}
                loading={sending}
                disabled={previewCount === 0}
              >
                Disparar agora
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
