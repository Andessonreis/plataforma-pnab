import type { InscricaoStatus } from '@prisma/client'
import { ETAPAS_RECURSO_ROTULO, type EtapaRecurso } from '@/lib/edital/etapas-recurso'
import { PUBLICACAO_STATUS_FILTER } from '@/lib/edital/publicacoes'
import { RECURSO_FASE_TO_JANELA } from '@/lib/edital/recurso-janela'
import { janelaParaAcao } from '@/lib/utils/cronograma-janela'
import type { AcaoJanela } from '@/types/cronograma'

export interface EtapaConfig {
  rotulo: string
  /**
   * Valores de `Recurso.fase` que a etapa pode cobrir, na ordem em que o
   * cronograma é consultado. O prazo de cada fase vem de RECURSO_FASE_TO_JANELA.
   */
  fases: readonly [string, ...string[]]
  /** Status das inscrições que entraram na etapa. */
  universo: InscricaoStatus[]
  /** Rótulo curto: rótulos longos quebram a linha da tabela de dados do PDF. */
  labelUniverso: string
}

export const ETAPAS_RECURSO: Record<EtapaRecurso, EtapaConfig> = {
  habilitacao: {
    rotulo: ETAPAS_RECURSO_ROTULO.habilitacao,
    fases: ['HABILITACAO'],
    universo: PUBLICACAO_STATUS_FILTER.PUBLICACAO_HABILITADOS,
    labelUniverso: 'Inscrições analisadas',
  },
  selecao: {
    rotulo: ETAPAS_RECURSO_ROTULO.selecao,
    // O edital cadastra o recurso da seleção contra o resultado preliminar ou,
    // como o Festival, contra o resultado final.
    fases: ['RESULTADO_PRELIMINAR', 'RESULTADO_FINAL'],
    // Inclui RECURSO_ABERTO por compatibilidade com inscrições de editais
    // anteriores: submitRecurso já não move a inscrição para esse status.
    universo: PUBLICACAO_STATUS_FILTER.PUBLICACAO_RESULTADO_PRELIMINAR,
    labelUniverso: 'Inscrições classificadas',
  },
}

/**
 * Fase de recurso que o extrato da etapa cobre e a ação do cronograma que
 * delimita o prazo dela: a primeira de `fases` cuja janela o edital cadastrou.
 *
 * Sem janela em nenhuma delas cai na primeira fase, e é o cálculo do prazo que
 * recusa a emissão, como sempre foi.
 */
export function faseDaEtapa(
  cronograma: unknown,
  { fases }: EtapaConfig,
): { fase: string; acaoJanela: AcaoJanela } {
  const candidatas = fases.map((fase) => ({ fase, acaoJanela: RECURSO_FASE_TO_JANELA[fase] }))
  return candidatas.find(({ acaoJanela }) => janelaParaAcao(cronograma, acaoJanela) !== null) ?? candidatas[0]
}
