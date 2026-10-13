'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/memorial/exposicoes', rotulo: 'Exposições' },
  { href: '/memorial/fotografias', rotulo: 'Fotografias' },
  { href: '/memorial/pessoas', rotulo: 'Pessoas' },
  { href: '/memorial/linha-do-tempo', rotulo: 'Linha do tempo' },
  { href: '/memorial/sobre', rotulo: 'Sobre' },
]

/**
 * Barra própria do Memorial, abaixo do cabeçalho do portal. No celular vira duas
 * linhas: nome e agendamento em cima, seções roláveis embaixo; o agendamento fica
 * sempre à vista, separado das seções de leitura.
 */
export function NavegacaoMemorial({ nome }: { nome: string }) {
  const caminho = usePathname()

  return (
    <nav aria-label="Seções do Memorial" className="border-b border-tinta-900/15 bg-papel-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 px-4 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link
          href="/memorial"
          aria-current={caminho === '/memorial' ? 'page' : undefined}
          className="titulo order-1 flex min-h-[48px] shrink-0 items-center text-base tracking-wide text-tinta-900 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {nome}
        </Link>
        <ul className="scrollbar-hide order-3 -mx-1 flex w-full min-w-0 items-center gap-1 overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto sm:flex-1">
          {LINKS.map((l) => {
            const ativo = caminho.startsWith(l.href)
            return (
              <li key={l.href} className="shrink-0">
                <Link
                  href={l.href}
                  aria-current={ativo ? 'page' : undefined}
                  className={`flex min-h-[48px] items-center border-b-2 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600 ${
                    ativo ? 'border-brand-600 font-semibold text-tinta-900' : 'border-transparent text-tinta-700 hover:text-tinta-950'
                  }`}
                >
                  {l.rotulo}
                </Link>
              </li>
            )
          })}
        </ul>
        <Link
          href="/memorial/agendar"
          className="order-2 ml-auto inline-flex min-h-[44px] shrink-0 items-center bg-turquesa-700 px-4 text-sm font-semibold text-white hover:bg-turquesa-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700 sm:order-3 sm:ml-0"
        >
          Agende sua visita
        </Link>
      </div>
    </nav>
  )
}
