/**
 * Alerta exibido quando uma ação (avaliar/habilitar) está fora da fase
 * do edital. Para ADMIN, expande em um bloco de "override" com children.
 */

interface ForaDaFaseAlertProps {
  mensagem: string
  isAdmin?: boolean
  children?: React.ReactNode
}

export function ForaDaFaseAlert({ mensagem, isAdmin = false, children }: ForaDaFaseAlertProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-amber-200 flex items-center gap-2.5">
        <svg className="h-5 w-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">{mensagem}</p>
          <p className="text-xs text-amber-800 mt-0.5">
            {isAdmin
              ? 'Você é admin: pode forçar a ação com justificativa registrada em auditoria.'
              : 'Aguarde a fase apropriada do edital.'}
          </p>
        </div>
      </div>
      {isAdmin && children && (
        <div className="p-4 bg-white border-t border-amber-100">
          {children}
        </div>
      )}
    </div>
  )
}
