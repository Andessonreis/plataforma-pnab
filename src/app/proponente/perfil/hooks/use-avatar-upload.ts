'use client'

import { useState, type ChangeEvent } from 'react'
import { toast } from '@/hooks/use-toast'

/** Estado e handlers do upload/remoção de foto de perfil. Isolado dos demais
 * formulários da página porque tem seu próprio ciclo de vida (envia assim que
 * o arquivo é escolhido, sem botão de submit). */
export function useAvatarUpload(initialAvatarUrl: string | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [avatarBusy, setAvatarBusy] = useState(false)

  async function handleAvatarUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reenviar o mesmo arquivo depois
    if (!file) return

    setAvatarBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/proponente/avatar', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Falha ao enviar foto', description: json.message })
        return
      }

      setAvatarUrl(json.data.avatarUrl)
      toast({ title: 'Foto atualizada' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro de rede',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleAvatarRemove() {
    if (!avatarUrl) return
    if (!confirm('Remover sua foto de perfil?')) return

    setAvatarBusy(true)
    try {
      const res = await fetch('/api/proponente/avatar', { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Falha ao remover foto', description: json.message })
        return
      }

      setAvatarUrl(null)
      toast({ title: 'Foto removida' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro de rede',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setAvatarBusy(false)
    }
  }

  return { avatarUrl, avatarBusy, handleAvatarUpload, handleAvatarRemove }
}
