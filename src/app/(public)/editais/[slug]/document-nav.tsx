'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { IconAccessible, IconArrowRight, IconChevronDown } from '@/components/ui/icons'
import { useDocumentNavState } from './use-document-nav'

export interface ParteDoEdital {
  id: string
  label: string
}

interface DocumentoNavProps {
  partes: ParteDoEdital[]
  versaoAcessivelHref: string | null
  /** Rótulo e destino da classificação, quando já é pública. */
  resultado: { href: string; titulo: string } | null
  /** `null` quando não há inscrição a oferecer nesta sessão. */
  inscricao: { href: string; rotulo: string } | null
}

function numero(indice: number): string {
  return String(indice + 1).padStart(2, '0')
}

/**
 * Navegação do documento — sumário com estado ativo por scroll, grudado no
 * topo logo depois da capa.
 *
 * O `top` acompanha a altura real do cabeçalho público via `ResizeObserver`,
 * em vez de um valor fixo: o cabeçalho recolhe ao rolar e difere entre
 * mobile e desktop, e um offset chumbado erraria em algum dos dois.
 *
 * Índice interno (âncoras `#`) e documentos relacionados (Resultado, versão
 * acessível) ficam em grupos visualmente separados — são coisas diferentes:
 * um pula dentro desta página, o outro leva a outra.
 */
export function DocumentoNav({ partes, versaoAcessivelHref, resultado, inscricao }: DocumentoNavProps) {
  const { ativa, topoCabecalho } = useDocumentNavState(partes)
  const detalhesRef = useRef<HTMLDetailsElement>(null)

  if (partes.length === 0 && !resultado && !versaoAcessivelHref) return null

  const temVerTambem = resultado !== null || versaoAcessivelHref !== null

  return (
    <nav
      aria-label="Navegação do documento"
      className="sticky z-30 border-b-2 border-tinta-900 bg-papel-100"
      style={{ top: topoCabecalho }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile: painel vertical por trás de um gatilho — uma lista horizontal
            de itens nunca cabe bem em qualquer contagem, um painel sempre cabe. */}
        <details ref={detalhesRef} className="group py-1 lg:hidden">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tinta-700 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500">
            Nesta página
            <IconChevronDown
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <div className="space-y-1 pb-3">
            {partes.map((parte, indice) => (
              <a
                key={parte.id}
                href={`#${parte.id}`}
                className="flex min-h-[44px] items-center gap-3 px-1 text-sm font-semibold text-tinta-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500"
              >
                <span className="titulo text-xs text-tinta-400" aria-hidden="true">
                  {numero(indice)}
                </span>
                {parte.label}
              </a>
            ))}

            {temVerTambem && (
              <div className="mt-2 border-t border-tinta-900/15 pt-2">
                <p className="rotulo px-1 text-[0.65rem] text-tinta-400">Ver também</p>
                {resultado && (
                  <Link
                    href={resultado.href}
                    className="flex min-h-[44px] items-center gap-1.5 px-1 text-sm font-semibold text-tinta-900"
                  >
                    {resultado.titulo}
                  </Link>
                )}
                {versaoAcessivelHref && (
                  <Link
                    href={versaoAcessivelHref}
                    className="flex min-h-[44px] items-center gap-1.5 px-1 text-sm font-semibold text-turquesa-700"
                  >
                    <IconAccessible className="h-4 w-4" aria-hidden="true" />
                    Versão acessível
                  </Link>
                )}
              </div>
            )}

            {inscricao && (
              <Link
                href={inscricao.href}
                className="mt-2 flex min-h-[44px] items-center justify-center gap-2 bg-accent-500 px-4 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950"
              >
                {inscricao.rotulo}
                <IconArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </details>

        {/* Desktop: barra numerada, com o grupo de âncoras e o grupo de
            documentos relacionados separados por um fio. */}
        <div className="hidden items-stretch gap-6 lg:flex">
          {partes.length > 0 && (
            <div className="scrollbar-hide flex flex-1 items-stretch gap-1 overflow-x-auto">
              {partes.map((parte, indice) => {
                const selecionada = ativa === parte.id
                return (
                  <a
                    key={parte.id}
                    href={`#${parte.id}`}
                    aria-current={selecionada ? 'true' : undefined}
                    className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500 ${
                      selecionada
                        ? 'border-accent-500 text-tinta-900'
                        : 'border-transparent text-tinta-500 hover:text-brand-700'
                    }`}
                  >
                    <span className="titulo text-[0.7rem] text-tinta-400" aria-hidden="true">
                      {numero(indice)}
                    </span>
                    {parte.label}
                  </a>
                )
              })}
            </div>
          )}

          {temVerTambem && (
            <div className="flex shrink-0 items-center gap-5 border-l border-tinta-900/15 pl-6">
              <span className="rotulo text-[0.65rem] text-tinta-400">Ver também</span>
              {resultado && (
                <Link
                  href={resultado.href}
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-tinta-900 underline-offset-4 hover:underline"
                >
                  {resultado.titulo}
                </Link>
              )}
              {versaoAcessivelHref && (
                <Link
                  href={versaoAcessivelHref}
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-turquesa-700 underline-offset-4 hover:underline"
                >
                  <IconAccessible className="h-4 w-4" aria-hidden="true" />
                  Versão acessível
                </Link>
              )}
            </div>
          )}

          {inscricao && (
            <Link
              href={inscricao.href}
              className="ml-auto inline-flex min-h-[44px] shrink-0 items-center gap-2 bg-accent-500 px-4 text-xs font-bold uppercase tracking-[0.12em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-tinta-900"
            >
              {inscricao.rotulo}
              <IconArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
