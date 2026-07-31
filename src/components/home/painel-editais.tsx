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
 */
export function PainelEditais({ editais }: PainelEditaisProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <p className="font-caveat text-2xl leading-none text-accent-300">Oportunidades</p>
          <h2 className="font-rye text-xl tracking-wide text-papel-50 sm:text-2xl">
            Editais publicados
          </h2>
        </div>
        <Link
          href="/editais"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-accent-300 underline-offset-4 hover:underline sm:inline-flex"
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
        <ul className="flex flex-col gap-3">
          {editais.map((edital) => (
            <li key={edital.id}>
              <Link
                href={`/editais/${edital.slug}`}
                className="group block rounded-md border-l-4 border-l-accent-500 bg-papel-50 px-4 py-3.5 transition-colors hover:bg-papel-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="section-label truncate text-tinta-600">{edital.categoria}</span>
                  <Badge variant={edital.statusVariant} dot>
                    {edital.statusLabel}
                  </Badge>
                </div>

                <h3 className="mb-2 font-semibold leading-snug text-tinta-900 group-hover:text-brand-700">
                  {edital.titulo}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tinta-700">
                  {edital.prazoLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <IconCalendar className="h-4 w-4 shrink-0 text-tinta-400" />
                      {edital.prazoLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 font-semibold text-brand-700">
                    <IconCurrency className="h-4 w-4 shrink-0 text-tinta-400" />
                    {edital.valor}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/editais"
        className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-semibold text-accent-300 underline-offset-4 hover:underline sm:hidden"
      >
        Ver todos os editais
        <IconArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
