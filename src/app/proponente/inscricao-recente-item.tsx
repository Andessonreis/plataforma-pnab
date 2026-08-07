import Link from 'next/link'
import { Carimbo } from '@/components/ui/carimbo'
import { inscricaoStatusLabel } from '@/lib/status-maps'
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
 * Registro de inscrição em formato de ficha — carimbo da situação, não pílula
 * colorida — a mesma linguagem que os dossiês de edital já usam. Um único
 * layout responsivo, sem tabela separada pro desktop.
 */
export function InscricaoRecenteItem({ id, numero, status, createdAt, editalTitulo }: InscricaoRecenteItemProps) {
  return (
    <Link
      href={`/proponente/inscricoes/${id}`}
      className="flex flex-col gap-3 border-b border-tinta-900/10 py-4 transition-colors last:border-b-0 hover:bg-papel-100/40 sm:flex-row sm:items-center sm:gap-4 sm:px-2"
    >
      <Carimbo tom={tomCarimboDeStatus(status)} className="shrink-0 self-start sm:self-center">
        {inscricaoStatusLabel[status]}
      </Carimbo>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-tinta-950 leading-snug">{editalTitulo}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-tinta-700/60">
          {/* deslop-ignore-next-line 34 — número de protocolo, identificador real, não decoração */}
          <span className="font-mono">{numero}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(createdAt)}</span>
        </p>
      </div>

      <span className="rotulo shrink-0 text-xs text-brand-700 sm:text-right">Ver detalhes</span>
    </Link>
  )
}
