'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StatusConteudo } from '@prisma/client'
import Link from 'next/link'
import { botaoNeutro, botaoPerigo, botaoPrimario } from '@/app/admin/memorial/_ui'
import { toast } from '@/hooks/use-toast'

interface AcoesQuestionarioProps {
  id: string
  titulo: string
  status: StatusConteudo
  respostas: number
}

type Acao = 'status' | 'duplicar' | 'excluir'

const BASE = '/admin/memorial/questionarios'

/**
 * Publicar ou parar de receber respostas, copiar e excluir. Questionário com respostas não tem
 * botão de excluir: as respostas são registro e a API recusaria de qualquer jeito.
 */
export function AcoesQuestionario({ id, titulo, status, respostas }: AcoesQuestionarioProps) {
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
    }, publicado ? 'Questionário arquivado: não recebe mais respostas' : 'Questionário publicado')
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
      <button type="button" className={publicado ? botaoNeutro : botaoPrimario} disabled={emAndamento !== null} onClick={alternarPublicacao}>
        {emAndamento === 'status' ? 'Aguarde…' : publicado ? 'Parar de receber respostas' : status === 'ARQUIVADO' ? 'Publicar de novo' : 'Publicar'}
      </button>
      <Link href={`${BASE}/${id}/respostas`} className={botaoNeutro}>
        {respostas === 1 ? 'Ver 1 resposta' : `Ver ${respostas} respostas`}
      </Link>
      <button type="button" className={botaoNeutro} disabled={emAndamento !== null} onClick={duplicar}>
        {emAndamento === 'duplicar' ? 'Copiando…' : 'Fazer uma cópia'}
      </button>
      {respostas === 0 && (
        <button type="button" className={botaoPerigo} disabled={emAndamento !== null} onClick={excluir}>
          {emAndamento === 'excluir' ? 'Excluindo…' : 'Excluir'}
        </button>
      )}
    </>
  )
}
