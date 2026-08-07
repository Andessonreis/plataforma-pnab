import Link from 'next/link'
import { IconArrowRight } from '@/components/ui'
import { Carimbo } from '@/components/ui/carimbo'
import { inscricaoStatusLabel } from '@/lib/status-maps'
import { tomCarimboDeStatus } from '../status-carimbo'
import type { InscricaoStatus } from '@prisma/client'

interface InscricaoItemData {
  id: string
  numero: string
  categoria: string | null
  status: InscricaoStatus
  submittedAt: Date | null
  edital: { titulo: string }
}

function formatarData(data: Date) {
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

interface InscricaoItemProps {
  inscricao: InscricaoItemData
  /** Marca o carimbo com o id do tour guiado — só o primeiro item da lista precisa. */
  destaqueTour?: boolean
}

function InscricaoItem({ inscricao, destaqueTour }: InscricaoItemProps) {
  return (
    <li>
      <Link
        href={`/proponente/inscricoes/${inscricao.id}`}
        className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-papel-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-tinta-700/60">
            {/* deslop-ignore-next-line 34 — número de processo, não prosa; mono alinha os dígitos como em informacoes-gerais-card.tsx */}
            <span className="font-mono">{inscricao.numero}</span>
            {inscricao.categoria && (
              <>
                <span aria-hidden="true">·</span>
                <span>{inscricao.categoria}</span>
              </>
            )}
          </div>
          <h3 className="mt-0.5 line-clamp-2 text-base font-semibold text-tinta-950 sm:line-clamp-none sm:truncate">
            {inscricao.edital.titulo}
          </h3>
          <p className="mt-1 text-xs text-tinta-700/60">
            {inscricao.submittedAt ? `Enviada em ${formatarData(inscricao.submittedAt)}` : 'Ainda não enviada'}
          </p>
        </div>

        <div
          id={destaqueTour ? 'tour-inscricoes-carimbo' : undefined}
          className="flex shrink-0 items-center gap-3 self-start sm:self-center"
        >
          <Carimbo tom={tomCarimboDeStatus(inscricao.status)}>
            {inscricaoStatusLabel[inscricao.status]}
          </Carimbo>
          <IconArrowRight className="h-4 w-4 shrink-0 text-tinta-300 transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-brand-600" />
        </div>
      </Link>
    </li>
  )
}

export { InscricaoItem }
export type { InscricaoItemData }
