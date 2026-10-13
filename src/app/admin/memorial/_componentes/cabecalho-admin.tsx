import Link from 'next/link'
import type { ReactNode } from 'react'
import { IconArrowLeft } from '@/components/ui'

interface CabecalhoAdminProps {
  titulo: string
  descricao?: string
  voltar?: { href: string; rotulo: string }
  /** Botões à direita (ex.: "Nova exposição"). */
  children?: ReactNode
}

export function CabecalhoAdmin({ titulo, descricao, voltar, children }: CabecalhoAdminProps) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {voltar && (
          <Link
            href={voltar.href}
            className="mb-2 inline-flex min-h-[44px] items-center gap-1.5 text-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            <IconArrowLeft className="h-4 w-4" />
            {voltar.rotulo}
          </Link>
        )}
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-2xl text-sm text-slate-600">{descricao}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  )
}
