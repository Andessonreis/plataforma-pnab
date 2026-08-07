import { IconInfo } from '@/components/ui'
import { janelaParaAcao, mensagemJanela } from '@/lib/utils/cronograma-janela'
import type { AcaoJanela } from '@/types/cronograma'
import type { InscricaoStatus } from '@prisma/client'
import { RecursoForm } from './recurso/recurso-form'

const FASES_COM_RECURSO: InscricaoStatus[] = ['INABILITADA', 'RESULTADO_PRELIMINAR', 'NAO_CONTEMPLADA', 'SUPLENTE']

interface Props {
  status: InscricaoStatus
  cronograma: unknown
  inscricaoId: string
  numero: string
  proponenteNome: string
}

/** Determina a fase de recurso cabível para o status atual da inscrição. */
function faseDoRecurso(status: InscricaoStatus): 'HABILITACAO' | 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL' {
  if (status === 'INABILITADA') return 'HABILITACAO'
  if (status === 'RESULTADO_PRELIMINAR') return 'RESULTADO_PRELIMINAR'
  return 'RESULTADO_FINAL'
}

/** Ação de janela do cronograma que gateia essa fase (null = sem gate, sempre liberado). */
function acaoJanelaDaFase(fase: string): AcaoJanela | null {
  if (fase === 'HABILITACAO') return 'RECURSO_HABILITACAO_JANELA'
  if (fase === 'RESULTADO_PRELIMINAR') return 'RECURSO_RESULTADO_JANELA'
  return null
}

/**
 * Bloco "Interpor Recurso" — só aparece nos status onde recurso cabe, e é
 * gateado pela janela de cronograma da fase correspondente (se configurada).
 * Seção da coluna lateral, sem Card próprio. Quando a janela está aberta,
 * é a única pendência que exige ação do proponente na tela — sinalizada em
 * accent, a exceção pontual da paleta.
 */
export function InterporRecursoSection({ status, cronograma, inscricaoId, numero, proponenteNome }: Props) {
  if (!FASES_COM_RECURSO.includes(status)) return null

  const fase = faseDoRecurso(status)
  const acaoJanela = acaoJanelaDaFase(fase)
  const janelaInfo = acaoJanela ? janelaParaAcao(cronograma, acaoJanela) : null

  if (janelaInfo && !janelaInfo.ativa) {
    const titulo = janelaInfo.status === 'antes' ? 'Recurso ainda não disponível' : 'Período de recurso encerrado'
    return (
      <div className="flex items-start gap-3">
        <IconInfo className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{titulo}</h3>
          <p className="text-sm text-slate-500 mt-1">{mensagemJanela(janelaInfo)}.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {janelaInfo?.ativa && (
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-accent-700">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" aria-hidden="true" />
          {mensagemJanela(janelaInfo)}.
        </p>
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
    </div>
  )
}
