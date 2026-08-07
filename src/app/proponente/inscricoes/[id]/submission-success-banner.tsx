import Link from 'next/link'
import { IconCheck, IconDownload } from '@/components/ui'
import { formatDateTime } from '@/lib/utils/format'

interface Props {
  inscricaoId: string
  numero: string
  submittedAt: Date | null
}

export function SubmissionSuccessBanner({ inscricaoId, numero, submittedAt }: Props) {
  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <IconCheck className="h-6 w-6 text-brand-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-slate-900">Inscrição enviada com sucesso</h2>
          <p className="text-sm text-slate-500 mt-2">Número de protocolo</p>
          <p className="text-2xl font-mono font-semibold text-brand-700 mt-1 break-all">{numero}</p>
          {submittedAt && (
            <p className="text-sm text-slate-500 mt-2">Enviada em {formatDateTime(submittedAt)}</p>
          )}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-1.5">Próximos passos</p>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              <li>Você receberá um e-mail de confirmação</li>
              <li>Aguarde a fase de habilitação para verificação dos documentos</li>
              <li>Acompanhe o andamento da sua inscrição nesta página</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href={`/api/proponente/inscricoes/${inscricaoId}/comprovante`}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
            >
              <IconDownload className="h-4 w-4" />
              Baixar Comprovante (PDF)
            </a>
            <Link
              href="/proponente/inscricoes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Voltar para minhas inscrições
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
