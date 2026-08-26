/**
 * Recorte por área (categoria) das inscrições.
 *
 * String vazia significa "todas as áreas", então "sem área preenchida" precisa
 * de um valor próprio na query string. Regra usada pela tela de exportação,
 * pelo CSV, pelo PDF de listas e pelo envio do relatório.
 */

export const SEM_AREA = '__sem_area__'

/** Rótulo de exibição de uma área — cobre o caso de categoria não preenchida. */
export function labelArea(nome: string | null | undefined): string {
  return nome && nome.length > 0 ? nome : 'Sem área definida'
}

/**
 * Traduz o parâmetro da URL no filtro Prisma de `Inscricao.categoria`.
 * Retorna `undefined` quando não há recorte de área a aplicar.
 */
export function categoriaWhere(param: string | undefined): string | null | undefined {
  if (!param) return undefined
  if (param === SEM_AREA) return null
  return param
}
