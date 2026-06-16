import { Card } from '@client/components/ui'
import type { InscricaoStatus } from '@prisma/client'
import { RecursoForm } from '../recurso/recurso-form'
import { janelaParaAcao, mensagemJanela } from '@shared/utils/cronograma-janela'
import type { AcaoJanela } from '@shared/types/cronograma'

interface InterporRecursoCardProps {
  status: InscricaoStatus
  cronograma: unknown
  inscricaoId: string
  numero: string
  proponenteNome: string
}

export function InterporRecursoCard({
  status,
  cronograma,
  inscricaoId,
  numero,
  proponenteNome,
}: InterporRecursoCardProps) {
  const fase =
    status === 'INABILITADA' ? 'HABILITACAO' :
    status === 'RESULTADO_PRELIMINAR' ? 'RESULTADO_PRELIMINAR' :
    'RESULTADO_FINAL'

  const acaoJanela: AcaoJanela | null =
    fase === 'HABILITACAO' ? 'RECURSO_HABILITACAO_JANELA' :
    fase === 'RESULTADO_PRELIMINAR' ? 'RECURSO_RESULTADO_JANELA' :
    null

  const janelaInfo = acaoJanela
    ? janelaParaAcao(cronograma, acaoJanela)
    : null

  // Se tem janela configurada e não está ativa, mostra alerta no lugar do form
  if (janelaInfo && !janelaInfo.ativa) {
    const titulo = janelaInfo.status === 'antes' ? 'Recurso ainda não disponível' : 'Período de recurso encerrado'
    return (
      <Card>
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
            <p className="text-xs text-slate-600 mt-1">{mensagemJanela(janelaInfo)}.</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      {janelaInfo?.ativa && (
        <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
          {mensagemJanela(janelaInfo)}.
        </div>
      )}
      <RecursoForm
        inscricaoId={inscricaoId}
        fase={fase}
        contexto={{
          entidadeNome: proponenteNome,
          projetoNome: numero,
          responsavelNome: proponenteNome,
        }}
      />
    </Card>
  )
}
