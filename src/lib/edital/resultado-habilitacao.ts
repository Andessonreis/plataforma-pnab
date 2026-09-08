import { parseBrazilDateTime } from '@/lib/utils/format'
import { listAcoesPublicacaoDoCronograma } from './publicacoes'

/**
 * O resultado da habilitação já foi publicado oficialmente?
 *
 * Resultado de habilitação é ato do edital: vale a partir da publicação no
 * Diário Oficial, na data que o próprio cronograma fixa. Antes disso, marcar
 * uma inscrição como habilitada ou inabilitada é trabalho interno de
 * conferência — não pode chegar ao proponente por painel nem por e-mail, sob
 * pena de o portal antecipar (e, na prática, publicar por conta própria) um
 * ato que ainda não saiu.
 *
 * Considera publicado quando a data de `PUBLICACAO_HABILITADOS` já passou, ou
 * a de `PUBLICACAO_HABILITADOS_POS_RECURSOS` — esta última cobre o edital que
 * só prevê a divulgação depois dos recursos.
 *
 * Cronograma sem nenhum desses marcos = nada a publicar por data; nesse caso
 * o portão se abre a partir da fase do edital (avaliação em diante), pra não
 * travar edital antigo que não tinha as ações cadastradas.
 */
export function resultadoHabilitacaoPublicado(
  cronograma: unknown,
  editalStatus: string,
  now: Date = new Date(),
): boolean {
  const marcos = listAcoesPublicacaoDoCronograma(cronograma).filter(
    (m) => m.acao === 'PUBLICACAO_HABILITADOS' || m.acao === 'PUBLICACAO_HABILITADOS_POS_RECURSOS',
  )

  if (marcos.length === 0) {
    return ['AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL', 'ENCERRADO']
      .includes(editalStatus)
  }

  return marcos.some((m) => {
    const data = parseBrazilDateTime(m.dataHora)
    return !isNaN(data.getTime()) && data <= now
  })
}

/**
 * Status da inscrição como o proponente pode vê-lo.
 *
 * Enquanto o resultado da habilitação não é publicado, HABILITADA e
 * INABILITADA voltam a ENVIADA: para quem se inscreveu, a inscrição segue
 * "enviada, em análise". Os demais status não passam por aqui — nota e
 * classificação já têm o próprio portão.
 */
export function statusVisivelParaProponente<T extends string>(
  status: T,
  resultadoPublicado: boolean,
): T | 'ENVIADA' {
  if (resultadoPublicado) return status
  return status === 'HABILITADA' || status === 'INABILITADA' ? 'ENVIADA' : status
}
