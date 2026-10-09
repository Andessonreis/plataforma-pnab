'use client'

import { useEffect, useState } from 'react'
import type { StatusConteudo } from '@prisma/client'
import { IconCheckSimple, IconExternalLink } from '@/components/ui'
import { botaoNeutro } from '@/app/admin/memorial/_ui'

const MENSAGEM: Partial<Record<StatusConteudo, string>> = {
  RASCUNHO: 'Rascunho: o público ainda não consegue responder. Publique quando as perguntas estiverem prontas.',
  ARQUIVADO: 'Arquivado: o endereço não aceita mais respostas. As que chegaram continuam guardadas.',
}

/** Endereço público com botão de copiar, ou o motivo de o questionário ainda não estar no ar. */
export function FaixaPublicacao({ slug, status }: { slug: string; status: StatusConteudo }) {
  const [copiado, setCopiado] = useState(false)
  const [origem, setOrigem] = useState('')
  const caminho = `/questionarios/${slug}`
  useEffect(() => setOrigem(window.location.host), [])

  if (status !== 'PUBLICADO') {
    return <p className="mb-6 rounded-xl border border-accent-300 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-900">{MENSAGEM[status] ?? MENSAGEM.RASCUNHO}</p>
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${caminho}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-oliva-200 bg-oliva-50 p-3 sm:flex-row sm:items-center sm:p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-oliva-800">No ar, recebendo respostas. Envie este endereço:</p>
        <p className="mt-0.5 truncate text-sm font-medium text-tinta-900">{origem}{caminho}</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={copiar} className={`${botaoNeutro} flex-1 whitespace-nowrap`}>
          {copiado && <IconCheckSimple className="h-4 w-4 text-oliva-700" />}
          <span role="status">{copiado ? 'Copiado' : 'Copiar endereço'}</span>
        </button>
        <a href={caminho} target="_blank" rel="noopener noreferrer" className={`${botaoNeutro} flex-1`}>
          Abrir
          <IconExternalLink className="h-4 w-4" />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </div>
    </div>
  )
}
