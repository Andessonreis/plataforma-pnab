import { Badge } from '@/components/ui'
import { RecursoAnexos } from '@/components/recurso/recurso-anexos'
import { formatDate } from '@/lib/utils/format'
import type { RecursoItem } from './types'

const FASE_LABEL: Record<string, string> = {
  HABILITACAO: 'Habilitação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RESULTADO_FINAL: 'Resultado Final',
}

function decisaoBadgeVariant(decisao: string) {
  return decisao === 'DEFERIDO' ? 'success' : 'error'
}

interface Props {
  recurso: RecursoItem
  inscricaoId: string
  liberada: boolean
}

export function RecursoItemCard({ recurso, inscricaoId, liberada }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-medium text-slate-500">{FASE_LABEL[recurso.fase] ?? recurso.fase}</span>
        {recurso.decisao && liberada ? (
          <Badge variant={decisaoBadgeVariant(recurso.decisao)}>{recurso.decisao}</Badge>
        ) : (
          <Badge variant="warning">Em análise</Badge>
        )}
      </div>

      {recurso.texto && (
        <p className="text-sm text-slate-900 mt-1 mb-1 whitespace-pre-wrap break-words">{recurso.texto}</p>
      )}

      {recurso.urlAnexos.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-500 mb-1">Evidências</p>
          <RecursoAnexos
            urls={recurso.urlAnexos}
            inscricaoId={inscricaoId}
            recursoId={recurso.id}
            scope="proponente"
          />
        </div>
      )}

      {recurso.justificativa && liberada && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-0.5">Decisão da comissão</p>
          <p className="text-sm text-slate-900 whitespace-pre-wrap break-words">{recurso.justificativa}</p>
        </div>
      )}

      {/* Respostas individuais (considerações dos avaliadores) — nomes ocultos em produção */}
      {liberada && recurso.respostas.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-100 space-y-3">
          <p className="text-xs font-medium text-slate-500">Considerações dos avaliadores</p>
          {recurso.respostas.map((resp, idx) => (
            <div key={idx} className="border-l-2 border-slate-200 pl-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500">Avaliador {idx + 1}</span>
                {resp.decisao && (
                  <Badge variant={decisaoBadgeVariant(resp.decisao)}>{resp.decisao}</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 italic whitespace-pre-wrap break-words">
                &ldquo;{resp.justificativa}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-2">Enviado em {formatDate(recurso.createdAt)}</p>
    </div>
  )
}
