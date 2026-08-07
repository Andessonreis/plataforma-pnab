import { IconDownload, IconFileText } from '@/components/ui'
import type { InscricaoStatus } from '@prisma/client'

interface Props {
  inscricaoId: string
  status: InscricaoStatus
}

/** Seção da coluna lateral — sem Card próprio, compõe o painel único de status/metadados. */
export function DocumentosCard({ inscricaoId, status }: Props) {
  if (status === 'RASCUNHO') return null

  return (
    <div id="tour-detalhe-documentos">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Documentos</h3>
      <div className="space-y-2">
        <a
          href={`/api/proponente/inscricoes/${inscricaoId}/comprovante`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors min-h-[44px]"
          download
        >
          <IconDownload className="h-4 w-4" />
          Baixar Comprovante (PDF)
        </a>
        <a
          href={`/api/proponente/inscricoes/${inscricaoId}/projeto-pdf`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
          download
        >
          <IconFileText className="h-4 w-4" />
          Exportar Projeto Completo (PDF)
        </a>
      </div>
    </div>
  )
}
