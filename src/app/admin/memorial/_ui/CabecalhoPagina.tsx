import type { ReactNode } from 'react'
import Link from 'next/link'
import { IconArrowLeft } from '@/components/ui'

interface Props {
  titulo: string
  /** Uma frase dizendo para que serve a tela, em linguagem de quem trabalha na Secretaria. */
  descricao?: string
  voltar?: { href: string; rotulo: string }
  /** Ações da página; a principal vem primeiro e é a única em destaque. */
  acoes?: ReactNode
}

export function CabecalhoPagina({ titulo, descricao, voltar, acoes }: Props) {
  return (
    <header className="mb-6">
      {voltar && (
        <Link
          href={voltar.href}
          className="mb-2 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-tinta-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-accent-500"
        >
          <IconArrowLeft className="h-4 w-4" />
          {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-tinta-900 sm:text-3xl">{titulo}</h1>
          {descricao && <p className="mt-1 max-w-2xl text-sm text-tinta-600">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
    </header>
  )
}
