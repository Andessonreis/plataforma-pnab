/**
 * Endereços das páginas públicas de resultado. Módulo folha: as páginas, o
 * cronograma, os e-mails e o serviço de publicação apontam para o mesmo lugar.
 */

/** Página da fase: o preliminar e o definitivo têm endereços próprios. */
export function hrefResultados(slug: string, definitivo: boolean): string {
  return `/editais/${slug}/${definitivo ? 'resultados-definitivo' : 'resultados-preliminar'}`
}

/** Página com a decisão dos recursos da etapa de seleção. */
export function hrefResultadoRecursos(slug: string): string {
  return `/editais/${slug}/resultados-recurso-avaliacao`
}
