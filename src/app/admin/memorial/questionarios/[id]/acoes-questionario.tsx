'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StatusConteudo } from '@prisma/client'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

interface AcoesQuestionarioProps {
  id: string
  slug: string
  titulo: string
  status: StatusConteudo
  respostas: number
}

type Acao = 'status' | 'duplicar' | 'excluir'

const BASE = '/admin/memorial/questionarios'

/**
 * Publicar/arquivar, duplicar e excluir. Questionário com respostas não tem
 * botão de excluir: as respostas são registro e a API recusaria de qualquer jeito.
 */
export function AcoesQuestionario({ id, slug, titulo, status, respostas }: AcoesQuestionarioProps) {
  const router = useRouter()
  const [emAndamento, setEmAndamento] = useState<Acao | null>(null)
  const publicado = status === 'PUBLICADO'

  async function executar(acao: Acao, url: string, init: RequestInit, sucesso: string) {
    setEmAndamento(acao)
    try {
      const res = await fetch(url, init)
      const corpo = res.status === 204 ? {} : await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Não foi possível concluir', description: corpo.message })
        return null
      }
      toast({ title: sucesso })
      return corpo
    } catch {
      toast({ variant: 'destructive', title: 'Sem conexão', description: 'Confira sua internet e tente de novo.' })
      return null
    } finally {
      setEmAndamento(null)
    }
  }

  async function alternarPublicacao() {
    const proximo: StatusConteudo = publicado ? 'ARQUIVADO' : 'PUBLICADO'
    const ok = await executar('status', `/api/v1/questionarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: proximo }),
    }, publicado ? 'Questionário arquivado' : 'Questionário publicado')
    if (ok) router.refresh()
  }

  async function duplicar() {
    const corpo = await executar('duplicar', `/api/v1/questionarios/${id}/duplicar`, { method: 'POST' }, 'Cópia criada como rascunho')
    if (corpo?.data?.id) router.push(`${BASE}/${corpo.data.id}`)
  }

  async function excluir() {
    if (!window.confirm(`Excluir o questionário "${titulo}"? Esta ação não pode ser desfeita.`)) return
    const corpo = await executar('excluir', `/api/v1/questionarios/${id}`, { method: 'DELETE' }, 'Questionário excluído')
    if (corpo) router.push(BASE)
  }

  return (
    <>
      <Button href={`${BASE}/${id}/respostas`} variant="outline" size="sm">
        {respostas === 1 ? '1 resposta' : `${respostas} respostas`}
      </Button>
      {publicado && (
        <a
          href={`/questionarios/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Abrir no site
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      )}
      <Button type="button" size="sm" loading={emAndamento === 'status'} onClick={alternarPublicacao}>
        {publicado ? 'Arquivar' : 'Publicar'}
      </Button>
      <Button type="button" variant="ghost" size="sm" loading={emAndamento === 'duplicar'} onClick={duplicar}>
        Duplicar
      </Button>
      {respostas === 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-700 hover:bg-red-50"
          loading={emAndamento === 'excluir'}
          onClick={excluir}
        >
          Excluir
        </Button>
      )}
    </>
  )
}
