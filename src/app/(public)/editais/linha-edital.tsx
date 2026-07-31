import Link from 'next/link'
import type { EditalStatus } from '@prisma/client'
import { IconArrowRight } from '@/components/ui/icons'
import { CarimboStatus } from './carimbo-status'

export interface EditalListado {
  id: string
  slug: string
  ordinal: number
  titulo: string
  resumo: string | null
  categorias: string[]
  status: EditalStatus
  statusLabel: string
  encerrado: boolean
  prazoRotulo: string | null
  prazoData: string | null
  valor: string | null
}

interface LinhaEditalProps {
  edital: EditalListado
}

/**
 * Um edital como verbete de índice, não como cartão de vitrine.
 *
 * A grade de três colunas obrigava a truncar título e resumo em duas linhas e
 * deixava prazo e valor espremidos no rodapé do cartão — justamente os dois
 * dados que decidem se a pessoa vai se inscrever. Na linha larga o título
 * respira, e prazo e valor ganham um trilho próprio à direita, alinhados
 * entre todos os editais, o que permite comparar de relance ao descer a lista.
 *
 * O ordinal à esquerda é do índice: dá referência de posição em página
 * paginada e ancora a linha visualmente sem precisar de moldura.
 */
export function LinhaEdital({ edital }: LinhaEditalProps) {
  return (
    <li>
      <Link
        href={`/editais/${edital.slug}`}
        className={`group grid gap-x-6 gap-y-4 px-4 py-7 transition-colors hover:bg-papel-100/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500 sm:px-6 lg:grid-cols-[3.5rem_1fr_15rem] ${
          edital.encerrado ? 'opacity-70 hover:opacity-100' : ''
        }`}
      >
        <span
          aria-hidden="true"
          className="hidden font-rye text-3xl leading-none text-tinta-900/20 transition-colors group-hover:text-accent-500 lg:block"
        >
          {String(edital.ordinal).padStart(2, '0')}
        </span>

        <div className="min-w-0">
          <CarimboStatus status={edital.status} label={edital.statusLabel} className="mb-3" />

          <h2 className="font-rye text-xl leading-snug tracking-wide text-tinta-900 transition-colors group-hover:text-brand-700 sm:text-2xl">
            {edital.titulo}
          </h2>

          {edital.resumo && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta-600">{edital.resumo}</p>
          )}

          {edital.categorias.length > 0 && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-tinta-500">
              {edital.categorias.join(' · ')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-tinta-900/10 lg:border-l lg:pl-6">
          {edital.prazoRotulo && edital.prazoData && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-500">
                {edital.prazoRotulo}
              </p>
              <p className="text-base font-semibold text-tinta-900">{edital.prazoData}</p>
            </div>
          )}

          {edital.valor && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-500">
                Recursos
              </p>
              <p className="font-rye text-lg leading-tight text-brand-700">{edital.valor}</p>
            </div>
          )}

          <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
            Abrir edital
            <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </li>
  )
}
