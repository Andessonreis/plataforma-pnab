'use client'

import Link from 'next/link'
import { Bandeirola } from '@/components/ui/ornamentos'
import { SECOES, secaoAtiva } from './links'

interface ReguaSecoesProps {
  pathname: string
  /** Compacta a régua quando o masthead recolhe no scroll. */
  compacta: boolean
}

/**
 * Régua de seções — a navegação em faixa própria, de borda a borda.
 *
 * Não é a lista de links encostada no logo: as seções ocupam uma faixa
 * inteira, distribuídas e separadas por fios, como o índice impresso na
 * lombada de uma publicação. Isso tira a navegação da disputa com a marca e
 * dá a ela a largura da página.
 *
 * A seção ativa é marcada por uma bandeirola pendurada na faixa, forma
 * própria da identidade, no lugar do sublinhado e da pílula de fundo.
 */
export function ReguaSecoes({ pathname, compacta }: ReguaSecoesProps) {
  return (
    <nav aria-label="Seções do portal" className="hidden lg:block">
      <ul className="flex w-full items-stretch px-4 sm:px-6 lg:px-8 xl:px-12">
        {SECOES.map((secao) => {
          const ativa = secaoAtiva(secao.href, pathname)
          return (
            <li key={secao.href} className="relative flex-1 border-r border-tinta-900/10 first:border-l">
              <Link
                href={secao.href}
                aria-current={ativa ? 'page' : undefined}
                className={`group flex items-center justify-center px-2 text-center text-[0.8125rem] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500 ${
                  compacta ? 'h-11' : 'h-12'
                } ${ativa ? 'text-tinta-900' : 'text-tinta-500 hover:text-brand-700'}`}
              >
                {secao.label}
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-center scale-x-0 bg-accent-500 transition-transform duration-200 group-hover:scale-x-100"
                  aria-hidden="true"
                />
              </Link>

              {ativa && (
                <Bandeirola
                  className="pointer-events-none absolute -bottom-[13px] left-1/2 h-[18px] w-[13px] -translate-x-1/2 text-brand-600"
                  style={{ '--filete': '#f0e9d7' } as React.CSSProperties}
                />
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
