/**
 * Encerramento da fase de avaliação (Edital.avaliacaoEncerradaEm).
 *
 * Fecha a nota para o parecerista sem fechar o edital para a equipe interna.
 * Até aqui a única trava era a publicação do resultado preliminar: enquanto
 * ela não saía, o parecerista podia reabrir a própria avaliação finalizada e
 * mudar a nota — inclusive depois do prazo dele e enquanto a Secretaria já
 * estava conferindo bonificação e montando a classificação.
 *
 * A equipe interna continua editando de propósito: o trabalho dela (bônus,
 * conferência de anexo, correção de lançamento) acontece justamente depois do
 * prazo do parecerista.
 *
 * Não deriva de `Edital.status` porque o scheduler avança a fase sozinho pela
 * data do cronograma, sem checar se a avaliação de fato terminou — mesmo
 * motivo de `resultadoLiberadoEm` e `resultadoPreliminarPublicadoEm`.
 */

export const MENSAGEM_AVALIACAO_ENCERRADA =
  'A fase de avaliação deste edital foi encerrada pela Secretaria — não é mais possível lançar ou alterar notas.'

/** Bloqueia o parecerista depois do encerramento; não afeta a equipe interna. */
export function avaliacaoBloqueadaParaAvaliador(
  avaliacaoEncerradaEm: Date | null | undefined,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return false
  return avaliacaoEncerradaEm != null
}
