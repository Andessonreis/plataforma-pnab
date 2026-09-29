import { janelaParaAcao, type JanelaInfo } from '@/lib/utils/cronograma-janela'
import { acaoJanelaDaFase } from '@/lib/edital/recurso-janela'

export type FaseRecurso = 'HABILITACAO' | 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL'

/**
 * Fase do recurso cabível para o status da inscrição, ou null quando o status
 * não admite recurso. Fonte única para a tela do proponente e para a rota que
 * recebe o recurso.
 *
 * Contemplada não recorre: o recurso existe para quem ficou de fora ou abaixo.
 * Suplente e não contemplada recorrem na fase RESULTADO_FINAL porque é essa a
 * janela que o cronograma dos editais cadastra para a seleção
 * (`RECURSO_RESULTADO_FINAL_JANELA`, "Período para recursos — seleção").
 */
export function faseDoRecurso(status: string): FaseRecurso | null {
  if (status === 'INABILITADA') return 'HABILITACAO'
  if (status === 'RESULTADO_PRELIMINAR') return 'RESULTADO_PRELIMINAR'
  if (status === 'NAO_CONTEMPLADA' || status === 'SUPLENTE') return 'RESULTADO_FINAL'
  return null
}

/**
 * Rótulo da fase como o proponente a conhece. RESULTADO_PRELIMINAR e
 * RESULTADO_FINAL são o mesmo recurso para ele, contra o resultado da seleção;
 * "Resultado Final" dava a entender que o resultado final já tinha saído.
 */
export const ROTULO_FASE_RECURSO: Record<string, string> = {
  HABILITACAO: 'Habilitação',
  RESULTADO_PRELIMINAR: 'Resultado da seleção',
  RESULTADO_FINAL: 'Resultado da seleção',
}

export interface SituacaoRecurso {
  fase: FaseRecurso
  /** null quando o cronograma não cadastra janela para a fase (prazo livre). */
  janela: JanelaInfo | null
  /** O formulário pode ser enviado agora. */
  aberto: boolean
}

/**
 * Situação do recurso da inscrição para o proponente, ou null quando não há
 * recurso a oferecer (status sem recurso ou recurso da fase já protocolado).
 */
export function situacaoRecurso(
  status: string,
  cronograma: unknown,
  fasesJaRecorridas: string[],
  now: Date = new Date(),
): SituacaoRecurso | null {
  const fase = faseDoRecurso(status)
  if (!fase || fasesJaRecorridas.includes(fase)) return null

  const acao = acaoJanelaDaFase(fase)
  const janela = acao ? janelaParaAcao(cronograma, acao, now) : null
  return { fase, janela, aberto: !janela || janela.ativa }
}
