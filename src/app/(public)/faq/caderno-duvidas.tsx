'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { IconArrowRight, IconSearch } from '@/components/ui/icons'
import type { CadernoDeDuvidas } from './consulta'

interface CadernoDuvidasProps {
  cadernos: CadernoDeDuvidas[]
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Todas as dúvidas, com uma busca só e índice fixo ao lado.
 *
 * Antes cada grupo trazia o próprio campo de busca, então a página exibia um
 * campo por edital e cada um filtrava apenas o próprio bloco: quem digitasse
 * "prazo" no primeiro campo não via a resposta que estava no segundo. A busca
 * agora é única e atravessa pergunta e resposta de todos os cadernos.
 *
 * A comparação ignora acento: quem digita "inscricao" precisa achar
 * "inscrição".
 *
 * As perguntas abrem e fecham por `details`, elemento nativo — o teclado, o
 * leitor de tela e o Ctrl+F do navegador já sabem lidar com ele, o que não
 * acontece com um acordeão montado à mão.
 */
export function CadernoDuvidas({ cadernos }: CadernoDuvidasProps) {
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return cadernos
    return cadernos
      .map((caderno) => ({
        ...caderno,
        duvidas: caderno.duvidas.filter(
          (d) =>
            normalizar(d.pergunta).includes(termo) || normalizar(d.resposta).includes(termo),
        ),
      }))
      .filter((caderno) => caderno.duvidas.length > 0)
  }, [cadernos, busca])

  const encontradas = filtrados.reduce((soma, c) => soma + c.duvidas.length, 0)
  const buscando = busca.trim().length > 0

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
      <nav aria-label="Índice das dúvidas" className="lg:sticky lg:top-32 lg:self-start">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-tinta-500">Índice</p>
        <ul className="space-y-1">
          {cadernos.map((caderno) => (
            <li key={caderno.id}>
              <a
                href={`#${caderno.id}`}
                className="flex items-baseline justify-between gap-3 border-l-2 border-tinta-900/15 py-1.5 pl-3 text-sm text-tinta-700 transition-colors hover:border-accent-500 hover:text-brand-700"
              >
                <span className="min-w-0 truncate">{caderno.titulo}</span>
                <span className="shrink-0 text-xs tabular-nums text-tinta-400">
                  {caderno.duvidas.length}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-tinta-500">
            Buscar nas dúvidas
          </span>
          <span className="relative block">
            <IconSearch
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="prazo, documentos, recurso..."
              className="w-full border-2 border-tinta-900/20 bg-papel-50 py-3.5 pl-12 pr-4 text-base text-tinta-900 placeholder:text-tinta-400 focus:border-accent-500 focus:outline-none"
            />
          </span>
        </label>

        {buscando && (
          <p className="mt-3 text-sm text-tinta-600" role="status">
            {encontradas === 0
              ? 'Nenhuma dúvida corresponde à busca.'
              : `${encontradas} ${encontradas === 1 ? 'dúvida encontrada' : 'dúvidas encontradas'}.`}
          </p>
        )}

        {filtrados.map((caderno) => (
          <section key={caderno.id} id={caderno.id} className="mt-12 scroll-mt-32 first:mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-tinta-900 pb-3">
              <h2 className="titulo text-2xl leading-tight tracking-wide text-tinta-900">
                {caderno.titulo}
              </h2>
              {caderno.editalSlug && (
                <Link
                  href={`/editais/${caderno.editalSlug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
                >
                  Ver edital
                  <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            <div className="divide-y divide-tinta-900/15">
              {caderno.duvidas.map((duvida) => (
                <details key={duvida.id} className="group py-1" open={buscando}>
                  <summary className="flex cursor-pointer list-none items-start gap-4 py-4 titulo text-lg leading-snug tracking-wide text-tinta-900 transition-colors marker:content-none hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500">
                    <span
                      className="mt-1 shrink-0 font-questrial text-xl leading-none text-accent-600 transition-transform group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                    {duvida.pergunta}
                  </summary>
                  <p className="whitespace-pre-line pb-5 pl-9 text-[0.9375rem] leading-relaxed text-tinta-700">
                    {duvida.resposta}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
