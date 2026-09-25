import type { Recurso } from '@prisma/client'
import { Card, Badge } from '@/components/ui'
import { SomenteLeitura } from '@/components/espelho/somente-leitura'
import { RecursoDecision } from '@/app/admin/inscricoes/[id]/recurso-decision'

interface Props {
  inscricaoId: string
  recursos: Recurso[]
  /** Edital na fase de habilitação: só então o recurso pode ser decidido. */
  podeDecidir: boolean
  /** Modo espelho: mostra a decisão do recurso, mas travada. */
  somenteLeitura: boolean
}

/** Recursos da fase de habilitação, com a decisão do habilitador quando ainda cabe. */
export function RecursosHabilitacao({ inscricaoId, recursos, podeDecidir, somenteLeitura }: Props) {
  return (
    <Card padding="sm" className="sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
        Recursos de habilitação ({recursos.length})
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {recursos.map((recurso) => (
          <div key={recurso.id} className="p-3 sm:p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="info">{recurso.fase}</Badge>
              {recurso.decisao && (
                <Badge variant={recurso.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                  {recurso.decisao}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-700 mt-2 break-words">{recurso.texto}</p>
            {recurso.justificativa && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 mb-1">Justificativa:</p>
                <p className="text-sm text-slate-700 break-words">{recurso.justificativa}</p>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {new Date(recurso.createdAt).toLocaleDateString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
              })}
            </p>
            {!recurso.decisao && podeDecidir && (
              <div className="mt-3">
                <SomenteLeitura ativo={somenteLeitura}>
                  <RecursoDecision
                    inscricaoId={inscricaoId}
                    recursoId={recurso.id}
                    fase={recurso.fase}
                  />
                </SomenteLeitura>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
