'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface DeleteNoticiaButtonProps {
  noticiaId: string
  noticiaTitle: string
}

export function DeleteNoticiaButton({ noticiaId, noticiaTitle }: DeleteNoticiaButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a noticia "${noticiaTitle}"? Esta acao nao pode ser desfeita.`,
    )
    if (!confirmed) return

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/noticias/${noticiaId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.message || 'Erro ao excluir noticia.')
        return
      }

      router.push('/admin/noticias')
    } catch {
      alert('Erro de conexao. Tente novamente.')
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
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
      aria-label={`Excluir noticia ${noticiaTitle}`}
    >
      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Excluir
    </Button>
  )
}
