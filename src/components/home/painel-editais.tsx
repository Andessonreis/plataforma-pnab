import Link from 'next/link'
import { Badge } from '@/components/ui'
import { IconArrowRight, IconCalendar, IconCurrency } from '@/components/ui/icons'
import type { EditalResumo } from './types'

interface PainelEditaisProps {
  editais: EditalResumo[]
}

/**
 * Lista de editais abertos exibida ao lado da arte de destaque.
 *
 * Fica na abertura da página, acima da dobra, para que os editais sejam
 * visíveis assim que a pessoa acessa o portal — sem depender de rolagem
 * nem do que está sendo anunciado na arte.
 *
 * Mora num quadro de altura fixa, então a altura de cada cartão é previsível:
 * título em no máximo duas linhas, prazo e valor numa linha só. No celular
 * entram dois editais, cada um com título, situação e prazo (categoria e
 * valor ficam para a página do edital); o terceiro fica para "Ver todos", que
 * sobe para o cabeçalho e economiza a linha de baixo.
 */
export function PainelEditais({ editais }: PainelEditaisProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 flex items-end justify-between gap-3 md:mb-4">
        <div>
          <p className="rotulo text-xs leading-none text-accent-300">Oportunidades</p>
          <h2 className="titulo text-xl tracking-wide text-papel-50 sm:text-2xl">
            Editais publicados
          </h2>
        </div>
        <Link
          href="/editais"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-accent-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent-400"
        >
          Ver todos
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {editais.length === 0 ? (
        <p className="rounded-md border-2 border-dashed border-papel-100/25 px-4 py-8 text-center text-sm text-papel-200/80">
          Nenhum edital publicado no momento.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5 md:gap-3">
          {editais.map((edital, i) => (
            <li key={edital.id} className={i > 1 ? 'hidden md:block' : undefined}>
              <Link
                href={`/editais/${edital.slug}`}
                className="group block rounded-md border-l-4 border-l-accent-500 bg-papel-50 px-4 py-3 transition-colors hover:bg-papel-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
              >
                <div className="mb-1.5 hidden items-center justify-between gap-3 md:flex">
                  <span className="section-label truncate text-tinta-600">{edital.categoria}</span>
                  <Badge variant={edital.statusVariant} dot>
                    {edital.statusLabel}
                  </Badge>
                </div>

                <h3 className="mb-1.5 line-clamp-2 font-semibold leading-snug text-tinta-900 group-hover:text-brand-700">
                  {edital.titulo}
                </h3>

                <div className="flex items-center gap-x-3 overflow-hidden whitespace-nowrap text-sm text-tinta-700 md:gap-x-4">
                  <span className="shrink-0 md:hidden">
                    <Badge variant={edital.statusVariant} dot>
                      {edital.statusLabel}
                    </Badge>
                  </span>
                  {edital.prazoLabel && (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <IconCalendar className="h-4 w-4 shrink-0 text-tinta-400" />
                      <span className="truncate">{edital.prazoLabel}</span>
                    </span>
                  )}
                  <span className="hidden shrink-0 items-center gap-1.5 font-semibold text-brand-700 md:inline-flex">
                    <IconCurrency className="h-4 w-4 shrink-0 text-tinta-400" />
                    {edital.valor}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
