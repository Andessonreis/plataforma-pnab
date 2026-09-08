/**
 * Quando o resultado da habilitação pode chegar ao proponente.
 *
 * Não se apoia no cronograma de propósito: as datas são remarcadas com
 * frequência pela Secretaria e um edital pode estar com o cronograma
 * desatualizado em relação à fase real. Amarrar a divulgação a essas datas
 * já significaria publicar resultado por engano.
 *
 * A liberação é um ato explícito, registrado em `Inscricao.resultadoLiberadoEm`:
 * enquanto estiver nulo, marcar habilitada ou inabilitada é conferência
 * interna e não aparece pro agente cultural nem gera e-mail.
 */

/**
 * Status da inscrição como o proponente pode vê-lo.
 *
 * Sem liberação, HABILITADA e INABILITADA voltam a ENVIADA — que o painel do
 * proponente rotula como "Em análise". Os demais status não passam por aqui:
 * nota e classificação têm o próprio portão.
 */
export function statusVisivelParaProponente<T extends string>(
  status: T,
  resultadoLiberado: boolean,
): T | 'ENVIADA' {
  if (resultadoLiberado) return status
  return status === 'HABILITADA' || status === 'INABILITADA' ? 'ENVIADA' : status
}
