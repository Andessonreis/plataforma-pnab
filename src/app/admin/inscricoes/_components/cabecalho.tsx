import { Button, IconExport } from '@/components/ui'

interface CabecalhoInscricoesProps {
  isAvaliador: boolean
  total: number
  avisoNaoAtribuido: boolean
}

export function CabecalhoInscricoes({ isAvaliador, total, avisoNaoAtribuido }: CabecalhoInscricoesProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-tinta-950">
            {isAvaliador ? 'Minhas Avaliações' : 'Inscrições'}
          </h1>
          <p className="text-xs sm:text-sm text-tinta-700/60 mt-0.5 sm:mt-1">
            {isAvaliador ? `${total} inscrição(ões) atribuída(s) a você` : `${total} inscrição(ões)`}
          </p>
        </div>
        {!isAvaliador && (
          <Button href="/admin/inscricoes/export" variant="ghost" size="sm">
            <IconExport className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        )}
      </div>

      {avisoNaoAtribuido && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-accent-50 border border-accent-200 px-3.5 py-3 mb-4 text-sm text-accent-900">
          <svg className="h-4 w-4 mt-0.5 shrink-0 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Essa inscrição não foi atribuída a você. Abaixo estão suas atribuições.
        </div>
      )}
    </>
  )
}
