import Link from 'next/link'
import type { ReactNode } from 'react'
import { IconChevronLeft } from '@/components/ui'

interface CabecalhoProps {
  titulo: string
  descricao?: ReactNode
  voltar?: { href: string; rotulo: string }
  acoes?: ReactNode
}

/** Cabeçalho comum das telas de questionário no painel. */
export function Cabecalho({ titulo, descricao, voltar, acoes }: CabecalhoProps) {
  return (
    <header className="mb-4 sm:mb-6">
      {voltar && (
        <Link
          href={voltar.href}
          className="mb-1 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <IconChevronLeft className="h-4 w-4" aria-hidden="true" />
          {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{titulo}</h1>
          {descricao && <div className="mt-1 text-xs text-slate-600 sm:text-sm">{descricao}</div>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
    </header>
  )
}
