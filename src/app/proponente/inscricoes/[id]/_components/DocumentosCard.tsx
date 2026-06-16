import { Card } from '@client/components/ui'

interface DocumentosCardProps {
  inscricaoId: string
}

export function DocumentosCard({ inscricaoId }: DocumentosCardProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Documentos</h2>
      <div className="space-y-2">
        <a
          href={`/api/v1/inscricoes/inscricao/${inscricaoId}/comprovante`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors min-h-[44px]"
          download
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Baixar Comprovante (PDF)
        </a>
        <a
          href={`/api/v1/inscricoes/inscricao/${inscricaoId}/projeto-pdf`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
          download
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Exportar Projeto Completo (PDF)
        </a>
      </div>
    </Card>
  )
}
