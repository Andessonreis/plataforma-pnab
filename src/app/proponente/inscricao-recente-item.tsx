import Link from 'next/link'
import { IconChevronRight } from '@/components/ui'
import { Carimbo } from '@/components/ui/carimbo'
import { inscricaoStatusLabelProponente as inscricaoStatusLabel } from '@/lib/status-maps'
import { formatDate } from '@/lib/utils/format'
import { tomCarimboDeStatus } from './status-carimbo'
import type { InscricaoStatus } from '@prisma/client'

interface InscricaoRecenteItemProps {
  id: string
  numero: string
  status: InscricaoStatus
  createdAt: Date
  editalTitulo: string
}

/**
 * Registro de inscrição em formato de ficha: o carimbo da situação (mesma
 * linguagem dos dossiês de edital) à frente, edital e protocolo no meio.
 * Um único layout responsivo, sem tabela separada pro desktop.
 */
export function InscricaoRecenteItem({ id, numero, status, createdAt, editalTitulo }: InscricaoRecenteItemProps) {
  return (
    <Link
      href={`/proponente/inscricoes/${id}`}
      className="group flex min-h-[72px] flex-col gap-2 border-b border-tinta-900/15 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5 sm:px-2 [@media(hover:hover)]:hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900"
    >
      <Carimbo tom={tomCarimboDeStatus(status)} className="shrink-0 self-start !rotate-0 sm:w-36 sm:text-center">
        {inscricaoStatusLabel[status]}
      </Carimbo>

      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-tinta-900">{editalTitulo}</p>
        <p className="mt-0.5 text-sm text-tinta-700">
          {/* deslop-ignore-next-line 34 número de protocolo, identificador real, não decoração */}
          <span className="font-mono">{numero}</span>, criada em {formatDate(createdAt)}
        </p>
      </div>

      <IconChevronRight className="hidden h-5 w-5 shrink-0 text-tinta-600 transition-transform group-hover:translate-x-0.5 sm:block" />
    </Link>
  )
}
