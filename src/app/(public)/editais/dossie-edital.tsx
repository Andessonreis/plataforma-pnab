import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'
import { IconePrazo, IconeRecursos } from '@/components/ui/ornamentos/icones'
import { CarimboStatus } from './carimbo-status'
import type { EditalListado } from './linha-edital'

interface DossieEditalProps {
  edital: EditalListado
}

/**
 * Edital aberto, em bloco de destaque.
 *
 * Quem chega nesta página quer saber onde ainda dá para se inscrever. Os
 * editais abertos ganham área, prazo e valor legíveis de longe; os demais
 * viram consulta. Não há ordem entre eles, e por isso não há numeração: dois
 * editais abertos são igualmente urgentes, e numerá-los inventava uma fila.
 *
 * A contagem de dias fica em corpo grande porque é o dado que muda a decisão
 * da pessoa hoje. A data completa vem abaixo, para quem precisa se organizar.
 */
export function DossieEdital({ edital }: DossieEditalProps) {
  return (
    <li className="h-full">
      <Link
        href={`/editais/${edital.slug}`}
        className="group flex h-full flex-col border-2 border-tinta-900/15 bg-papel-50 p-6 transition-all hover:-translate-y-0.5 hover:border-tinta-900/30 hover:shadow-[5px_5px_0_0_theme(colors.tinta.900/0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
      >
        <CarimboStatus status={edital.status} label={edital.statusLabel} className="mb-4 self-start" />

        <h3 className="font-rye text-xl leading-snug tracking-wide text-tinta-900 transition-colors group-hover:text-brand-700 sm:text-2xl">
          {edital.titulo}
        </h3>

        {edital.resumo && (
          <p className="mt-3 text-sm leading-relaxed text-tinta-600">{edital.resumo}</p>
        )}

        {edital.categorias.length > 0 && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-tinta-500">
            {edital.categorias.join(' · ')}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-dashed border-tinta-900/15 pt-5">
          <div className="flex gap-3">
            <IconePrazo className="mt-0.5 h-6 w-6 shrink-0 text-brand-700" />
            <div className="min-w-0">
              <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-tinta-500">
                {edital.prazoRotulo ?? 'Prazo'}
              </dt>
              <dd>
                {edital.diasRestantes !== null ? (
                  <>
                    <span className="font-rye text-lg leading-tight text-tinta-900">
                      {edital.diasRestantes === 0
                        ? 'Encerra hoje'
                        : `${edital.diasRestantes} ${edital.diasRestantes === 1 ? 'dia' : 'dias'}`}
                    </span>
                    <span className="block text-xs text-tinta-500">{edital.prazoData}</span>
                  </>
                ) : (
                  <span className="text-sm text-tinta-700">{edital.prazoData ?? 'A definir'}</span>
                )}
              </dd>
            </div>
          </div>

          <div className="flex gap-3">
            <IconeRecursos className="mt-0.5 h-6 w-6 shrink-0 text-brand-700" />
            <div className="min-w-0">
              <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-tinta-500">
                Recursos
              </dt>
              <dd className="font-rye text-lg leading-tight text-brand-700">
                {edital.valor ?? 'A definir'}
              </dd>
            </div>
          </div>
        </dl>

        <span className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 bg-accent-500 px-5 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors group-hover:bg-accent-400">
          Ver edital e inscrever
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </li>
  )
}
