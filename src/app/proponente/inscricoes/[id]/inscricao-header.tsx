import Link from 'next/link'
import { Badge, IconChevronLeft } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { TourButton } from '../../tour-button'
import { PASSOS_DETALHE_INSCRICAO } from './detalhe-tour-steps'
import type { InscricaoStatus } from '@prisma/client'

interface Props {
  numero: string
  editalTitulo: string
  editalAno: number
  status: InscricaoStatus
}

export function InscricaoHeader({ numero, editalTitulo, editalAno, status }: Props) {
  return (
    // flex-wrap + min-w-0 evitam overflow horizontal (#81) quando título do
    // edital + label do status são longos em viewports estreitos.
    <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
      <div className="min-w-0 flex-1">
        <Link
          href="/proponente/inscricoes"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 mb-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <IconChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
        {/* Número do processo como rótulo, não título — a pessoa reconhece o
            edital pelo nome, não pelo código; mesma hierarquia de inscricao-item.tsx. */}
        <p className="font-mono text-xs text-slate-500">{numero}</p>
        <h1 className="mt-0.5 text-xl font-bold text-slate-900 break-words sm:text-2xl">
          {editalTitulo} ({editalAno})
        </h1>
        <TourButton passos={PASSOS_DETALHE_INSCRICAO} className="mt-3" />
      </div>
      <Badge variant={inscricaoStatusVariant[status]} className="text-sm px-3 py-1">
        {inscricaoStatusLabel[status]}
      </Badge>
    </div>
  )
}
