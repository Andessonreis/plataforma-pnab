import type { ReactNode } from 'react'
import Link from 'next/link'
import { botaoPrimario } from './classes'

interface Props {
  icone: ReactNode
  titulo: string
  /** Diz o que fazer, não só que está vazio. */
  texto: string
  acao?: { href: string; rotulo: string }
}

export function VazioAcionavel({ icone, titulo, texto, acao }: Props) {
  return (
    <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-tinta-900/15 bg-papel-50/60 px-6 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-800">{icone}</span>
      <h3 className="text-base font-bold text-tinta-900">{titulo}</h3>
      <p className="mt-1 max-w-sm text-sm text-tinta-600">{texto}</p>
      {acao && (
        <Link href={acao.href} className={`${botaoPrimario} mt-4`}>
          {acao.rotulo}
        </Link>
      )}
    </div>
  )
}
