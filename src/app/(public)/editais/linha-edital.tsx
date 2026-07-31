import Link from 'next/link'
import type { EditalStatus } from '@prisma/client'
import { IconArrowRight } from '@/components/ui/icons'
import { CarimboStatus } from './carimbo-status'

export interface EditalListado {
  id: string
  slug: string
  titulo: string
  resumo: string | null
  categorias: string[]
  status: EditalStatus
  statusLabel: string
  aberto: boolean
  prazoRotulo: string | null
  prazoData: string | null
  /** `null` quando não há prazo futuro no cronograma. */
  diasRestantes: number | null
  valor: string | null
}

interface LinhaEditalProps {
  edital: EditalListado
}

/**
 * Edital fora do prazo, em linha de consulta.
 *
 * O que já fechou não disputa atenção com o que está aberto, mas continua
 * público e precisa ser encontrável — inclusive anos depois. Por isso a linha
 * é densa e de altura fixa: uma lista assim atravessa centenas de registros
 * sem virar rolagem infinita, e mantém título, situação e valor alinhados em
 * colunas para varredura vertical.
 */
export function LinhaEdital({ edital }: LinhaEditalProps) {
  return (
    <li>
      <Link
        href={`/editais/${edital.slug}`}
        className="group grid items-center gap-x-6 gap-y-2 px-4 py-4 transition-colors hover:bg-papel-100/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500 sm:grid-cols-[1fr_10rem_9rem_2rem] sm:px-5"
      >
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-tinta-800 transition-colors group-hover:text-brand-700">
            {edital.titulo}
          </h3>
          {edital.categorias.length > 0 && (
            <p className="truncate text-xs uppercase tracking-[0.12em] text-tinta-500">
              {edital.categorias.join(' · ')}
            </p>
          )}
        </div>

        <CarimboStatus
          status={edital.status}
          label={edital.statusLabel}
          className="justify-self-start sm:justify-self-auto"
        />

        <span className="text-sm text-tinta-600 sm:text-right">{edital.valor ?? '—'}</span>

        <IconArrowRight className="hidden h-4 w-4 justify-self-end text-tinta-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-700 sm:block" />
      </Link>
    </li>
  )
}
