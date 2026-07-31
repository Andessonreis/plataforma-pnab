import Link from 'next/link'
import { IconAccessible } from '@/components/ui/icons'

export interface ParteDoEdital {
  id: string
  label: string
}

interface SumarioEditalProps {
  partes: ParteDoEdital[]
  versaoAcessivelHref: string | null
}

/**
 * Sumário do documento, em faixa fixa abaixo do cabeçalho.
 *
 * No lugar da barra lateral de cartões, que ocupava um terço da página com
 * caixas de aviso e atalhos repetidos. Um edital é documento longo: o que a
 * lateral tinha de útil era permitir pular para o cronograma ou para os
 * anexos, e é só isso que a faixa faz — de largura inteira, sempre à mão, sem
 * roubar espaço da leitura.
 *
 * Rola na horizontal no telefone em vez de quebrar em duas linhas: a faixa é
 * grudada no topo e uma segunda linha comeria a tela toda.
 */
export function SumarioEdital({ partes, versaoAcessivelHref }: SumarioEditalProps) {
  if (partes.length === 0) return null

  return (
    <nav
      aria-label="Partes do edital"
      className="sticky top-[7.5rem] z-30 border-b border-tinta-900/15 bg-papel-50/95 backdrop-blur lg:top-[8.75rem]"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <ul className="scrollbar-hide flex flex-1 gap-1 overflow-x-auto">
          {partes.map((parte) => (
            <li key={parte.id}>
              <a
                href={`#${parte.id}`}
                className="inline-flex min-h-[44px] items-center whitespace-nowrap px-3 text-xs font-bold uppercase tracking-[0.14em] text-tinta-600 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500"
              >
                {parte.label}
              </a>
            </li>
          ))}
        </ul>

        {versaoAcessivelHref && (
          <Link
            href={versaoAcessivelHref}
            className="hidden shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-turquesa-700 underline-offset-4 hover:underline sm:inline-flex"
          >
            <IconAccessible className="h-4 w-4" aria-hidden="true" />
            Versão acessível
          </Link>
        )}
      </div>
    </nav>
  )
}
