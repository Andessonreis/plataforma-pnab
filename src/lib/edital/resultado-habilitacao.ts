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
 * Status pós-habilitação que ainda não devem chegar ao proponente enquanto
 * `resultadoLiberadoEm` for nulo. Inclui EM_AVALIACAO: atribuir avaliador a
 * uma inscrição já habilitada muda esse status internamente, mas isso não é
 * o mesmo ato de divulgar o resultado da habilitação — sem essa entrada aqui,
 * o painel do proponente pularia direto pra "Em avaliação".
 */
const STATUS_POS_HABILITACAO_NAO_DIVULGADO = new Set(['HABILITADA', 'INABILITADA', 'EM_AVALIACAO'])

/**
 * Status da inscrição como o proponente pode vê-lo.
 *
 * Sem liberação, esses status voltam a ENVIADA — que o painel do proponente
 * rotula como "Em análise". Os demais status não passam por aqui: nota e
 * classificação têm o próprio portão.
 */
export function statusVisivelParaProponente<T extends string>(
  status: T,
  resultadoLiberado: boolean,
): T | 'ENVIADA' {
  if (resultadoLiberado) return status
  return STATUS_POS_HABILITACAO_NAO_DIVULGADO.has(status) ? 'ENVIADA' : status
}
