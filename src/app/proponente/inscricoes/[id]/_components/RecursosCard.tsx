import { Card, Badge } from '@client/components/ui'
import { respostaRecursoLiberada } from '@shared/edital/fase'
import { RecursoAnexos } from '@client/components/recurso/recurso-anexos'
import type { EditalStatus } from '@prisma/client'

interface RecursoView {
  id: string
  fase: string
  texto: string | null
  urlAnexos: string[]
  decisao: string | null
  justificativa: string | null
  createdAt: Date
}

interface RecursosCardProps {
  recursos: RecursoView[]
  inscricaoId: string
  editalStatus: EditalStatus
}

export function RecursosCard({ recursos, inscricaoId, editalStatus }: RecursosCardProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Recursos</h2>
      <div className="space-y-3">
        {recursos.map((recurso, i) => {
          const liberada = respostaRecursoLiberada(recurso.fase, editalStatus)
          return (
          <div key={i} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500">{recurso.fase}</span>
              {recurso.decisao && liberada ? (
                <Badge variant={recurso.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                  {recurso.decisao}
                </Badge>
              ) : (
                <Badge variant="warning">Em análise</Badge>
              )}
            </div>
            {recurso.texto && (
              <p className="text-xs text-slate-700 mt-1 mb-1 whitespace-pre-wrap break-words">{recurso.texto}</p>
            )}
            {recurso.urlAnexos && recurso.urlAnexos.length > 0 && (
              <div className="mt-2">
                <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-1">Evidências</p>
                <RecursoAnexos
                  urls={recurso.urlAnexos}
                  inscricaoId={inscricaoId}
                  recursoId={recurso.id}
                  scope="proponente"
                />
              </div>
            )}
            {recurso.justificativa && liberada && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-0.5">Decisão da comissão</p>
                <p className="text-xs text-slate-700 whitespace-pre-wrap break-words">{recurso.justificativa}</p>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Enviado em {new Date(recurso.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
          )
        })}
      </div>
    </Card>
  )
}
