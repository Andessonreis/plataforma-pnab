import Link from 'next/link'
import type { EditalStatus } from '@prisma/client'
import { IconEdit, IconUsers, IconExternalLink } from '@/components/ui'
import { GerarListasModal } from './gerar-listas-modal'

interface EditalActionsProps {
  editalId: string
  editalSlug: string
  editalTitulo: string
  editalStatus: EditalStatus
  inscricoesCount: number
  /** Esconde o link de inscritos (útil quando a lista já tem uma coluna própria pra isso, ex. tabela desktop). */
  showInscritos?: boolean
  /** Ícone + tooltip, sem rótulo visível — pra colunas de tabela com pouco espaço horizontal. */
  compact?: boolean
}

const baseLinkClass =
  'inline-flex min-h-[32px] items-center gap-1.5 rounded-md font-medium transition-colors hover:bg-slate-100'

/** Ações de um edital reaproveitadas entre o card mobile e a linha da tabela desktop. */
export function EditalActions({
  editalId,
  editalSlug,
  editalTitulo,
  editalStatus,
  inscricoesCount,
  showInscritos = true,
  compact = false,
}: EditalActionsProps) {
  const isRascunho = editalStatus === 'RASCUNHO'
  const linkClass = `${baseLinkClass} ${compact ? 'min-w-[32px] justify-center px-1' : 'px-1.5'}`
  const labelClass = compact ? 'sr-only' : ''

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
      <Link href={`/admin/editais/${editalId}/editar`} className={`${linkClass} text-brand-700`} title="Editar edital">
        <IconEdit className="h-3.5 w-3.5" />
        <span className={labelClass}>Editar</span>
      </Link>

      {showInscritos && (
        <Link
          href={`/admin/inscricoes?editalId=${editalId}`}
          className={`${linkClass} text-slate-600`}
          title={`${inscricoesCount} inscrito${inscricoesCount !== 1 ? 's' : ''} — ver inscritos`}
        >
          <IconUsers className="h-3.5 w-3.5" />
          <span className={labelClass}>{inscricoesCount} inscrito{inscricoesCount !== 1 ? 's' : ''}</span>
        </Link>
      )}

      <GerarListasModal
        editalId={editalId}
        editalTitulo={editalTitulo}
        editalStatus={editalStatus}
        compact={compact}
      />

      <Link
        href={`/editais/${editalSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkClass} text-slate-500`}
        title={
          isRascunho
            ? 'Pré-visualizar rascunho (visível só para admins) — abre em nova aba'
            : 'Ver página pública — abre em nova aba'
        }
      >
        <IconExternalLink className="h-3.5 w-3.5" />
        <span className={labelClass}>{isRascunho ? 'Preview' : 'Ver'}</span>
      </Link>
    </div>
  )
}
