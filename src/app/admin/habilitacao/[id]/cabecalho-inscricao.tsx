import type { InscricaoStatus } from '@prisma/client'
import { Badge, IconShield } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'

interface Props {
  numero: string
  status: InscricaoStatus
  editalTitulo: string
  editalAno: number
}

/** Cabeçalho institucional da conferência: número, situação e edital da inscrição. */
export function CabecalhoInscricao({ numero, status, editalTitulo, editalAno }: Props) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
          <IconShield className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight font-mono">
              {numero}
            </h1>
            <Badge variant={inscricaoStatusVariant[status]}>{inscricaoStatusLabel[status]}</Badge>
          </div>
          <p className="text-sm sm:text-base text-slate-600">
            {editalTitulo} <span className="text-slate-400">·</span> {editalAno}
          </p>
        </div>
      </div>
    </header>
  )
}
