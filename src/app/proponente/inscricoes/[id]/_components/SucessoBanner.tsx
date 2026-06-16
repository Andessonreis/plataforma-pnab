import Link from 'next/link'

interface SucessoBannerProps {
  inscricaoId: string
  numero: string
  submittedAt: Date | null
}

export function SucessoBanner({ inscricaoId, numero, submittedAt }: SucessoBannerProps) {
  return (
    <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 p-6">
      <div className="flex items-start gap-3">
        <svg className="h-8 w-8 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-emerald-800">Inscrição enviada com sucesso!</h2>
          <p className="text-sm text-emerald-700 mt-2">
            Seu número de protocolo:
          </p>
          <p className="text-2xl font-mono font-bold text-emerald-900 mt-1">{numero}</p>
          {submittedAt && (
            <p className="text-sm text-emerald-600 mt-2">
              Enviada em {new Date(submittedAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
              })}
            </p>
          )}
          <div className="mt-4 p-3 bg-emerald-100 rounded-md">
            <p className="text-sm text-emerald-800 font-medium">Próximos passos:</p>
            <ul className="text-sm text-emerald-700 mt-1 list-disc list-inside space-y-1">
              <li>Você receberá um e-mail de confirmação</li>
              <li>Aguarde a fase de habilitação para verificação dos documentos</li>
              <li>Acompanhe o andamento da sua inscrição nesta página</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href={`/api/v1/inscricoes/inscricao/${inscricaoId}/comprovante`}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors min-h-[44px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Baixar Comprovante (PDF)
            </a>
            <Link
              href="/proponente/inscricoes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-300 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors min-h-[44px]"
            >
              Voltar para minhas inscrições
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
