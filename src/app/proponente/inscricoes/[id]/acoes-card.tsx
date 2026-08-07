import Link from 'next/link'
import { IconEdit } from '@/components/ui'
import type { EditalStatus, InscricaoStatus } from '@prisma/client'
import { RetractAndEditButton } from './retract-and-edit-button'

interface Props {
  inscricaoId: string
  status: InscricaoStatus
  editalStatus: EditalStatus
}

/** Seção da coluna lateral — sem Card próprio, compõe o painel único de status/metadados. */
export function AcoesCard({ inscricaoId, status, editalStatus }: Props) {
  const podeRetirarEEditar = status === 'ENVIADA' && editalStatus === 'INSCRICOES_ABERTAS'

  return (
    <div id="tour-detalhe-acoes">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Ações</h3>
      <div className="space-y-2">
        {status === 'RASCUNHO' && (
          <Link
            href={`/proponente/inscricoes/${inscricaoId}/editar`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
          >
            <IconEdit className="h-4 w-4" />
            Editar Inscrição
          </Link>
        )}
        {podeRetirarEEditar && <RetractAndEditButton inscricaoId={inscricaoId} />}
        <Link
          href="/proponente/inscricoes"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          Voltar para Lista
        </Link>
      </div>
    </div>
  )
}
