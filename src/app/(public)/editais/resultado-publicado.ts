/**
 * Quando o resultado de um edital passa a ser público.
 *
 * A regra estava escrita só dentro da página de resultados, que era a única
 * que a conhecia — e por isso o edital não tinha como anunciar que o resultado
 * saiu. Aqui ela vira contrato dos dois lados: a página de resultados decide o
 * que mostrar, e a do edital decide se chama para lá.
 */

/** Fases em que a classificação já é pública. */
const FASES_COM_RESULTADO = [
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
] as const

/** Fases em que o resultado já não muda mais — sai o rótulo de "preliminar". */
const FASES_FINAIS = ['RESULTADO_FINAL', 'ENCERRADO'] as const

export interface ResultadoPublicado {
  href: string
  /** "Resultado final" ou "Resultado preliminar". */
  titulo: string
  /** Verdadeiro quando a classificação ainda admite recurso. */
  preliminar: boolean
}

export function resultadoPublicado(status: string, slug: string): ResultadoPublicado | null {
  if (!FASES_COM_RESULTADO.includes(status as (typeof FASES_COM_RESULTADO)[number])) return null

  const preliminar = !FASES_FINAIS.includes(status as (typeof FASES_FINAIS)[number])

  return {
    href: `/editais/${slug}/resultados`,
    titulo: preliminar ? 'Resultado preliminar' : 'Resultado final',
    preliminar,
  }
}
