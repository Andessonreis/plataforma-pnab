import type { ReactNode } from 'react'
import Link from 'next/link'
import { linkTexto } from './estilos'

interface SecaoPainelProps {
  /** Âncora da seção; também alimenta o `aria-labelledby` e o tour guiado. */
  id: string
  titulo: string
  children: ReactNode
  /** Atalho à direita do título (ex.: "Ver todas"). */
  acao?: { href: string; rotulo: string }
  className?: string
}

/**
 * Seção do painel: fio grosso de tinta no topo com o título pendurado nele
 * como a etiqueta de uma pasta, em tinta cheia; o conteúdo fica solto sobre o
 * papel. O peso está no título, não em caixas em volta do conteúdo.
 */
export function SecaoPainel({ id, titulo, children, acao, className = '' }: SecaoPainelProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={className}>
      <div className="flex items-start justify-between gap-3 border-t-4 border-tinta-900">
        <h2 id={`${id}-titulo`} className="titulo bg-tinta-900 px-3 pb-1.5 pt-1 text-xl text-papel-50">
          {titulo}
        </h2>
        {acao && (
          <Link href={acao.href} className={linkTexto}>
            {acao.rotulo}
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
