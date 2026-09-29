/**
 * Linha em que o avaliador se identifica no próprio parecer, como
 * "Avaliadora: Fulana (Banca Avaliadora ...)". O edital preserva a identidade
 * da comissão perante o proponente, mas o parecer é texto livre e alguns
 * avaliadores assinam no cabeçalho.
 */
const LINHA_IDENTIFICACAO = /^[ \t]*(avaliador|avaliadora|parecerista)(\(a\))?[ \t]*:.*(\r?\n)?/gim

/** Parecer como o proponente pode lê-lo, sem a linha de identificação do avaliador. */
export function parecerParaProponente(parecer: string): string {
  return parecer.replace(LINHA_IDENTIFICACAO, '').trim()
}
