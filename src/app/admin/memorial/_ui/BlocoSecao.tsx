import type { ReactNode } from 'react'
import Link from 'next/link'
import { linkDiscreto } from './classes'

interface Props {
  titulo: string
  /** Frase curta que explica o bloco; ajuda quem usa a tela pela primeira vez. */
  dica?: string
  verTudo?: { href: string; rotulo: string }
  children: ReactNode
  className?: string
}

/** Seção da página: título à esquerda, atalho à direita, conteúdo logo abaixo. */
export function BlocoSecao({ titulo, dica, verTudo, children, className = '' }: Props) {
  return (
    <section className={`rounded-xl border border-tinta-900/10 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-tinta-900">{titulo}</h2>
          {dica && <p className="mt-0.5 text-sm text-tinta-600">{dica}</p>}
        </div>
        {verTudo && (
          <Link href={verTudo.href} className={`${linkDiscreto} shrink-0 py-2`}>
            {verTudo.rotulo}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
