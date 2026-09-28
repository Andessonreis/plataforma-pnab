// Vagas/cotas/valor por categoria de um edital (Edital.categoriasConfig).
// Ausente/vazio no edital = categorias tratadas só como rótulo (comportamento legado).

export interface CotaConfig {
  key: string
  label: string
  vagas: number
  // Pontos de nota bônus somados a quem autodeclarou essa cota (undefined/0 = sem bônus).
  // Visível só pra SUPER_ADMIN e, quando liberado, pra ADMIN — nunca pro avaliador.
  pontosBonus?: number
}

/**
 * Para onde vai a vaga de cota sem optantes aptos:
 * - `AMPLA` (padrão): direto para a ampla concorrência (item 5.4 do edital do Festival).
 * - `OUTRAS_COTAS`: antes, para os optantes das demais cotas; só o que sobrar vai
 *   para a ampla concorrência (itens 6.7 e 6.7.1 do edital dos Mestres).
 */
export type DestinoVagaDeCotaVazia = 'AMPLA' | 'OUTRAS_COTAS'

export interface CategoriaConfig {
  nome: string
  // null = sem limite discreto de vagas (ex.: categorias de pessoa jurídica
  // sem vaga fixa, só um valor total de bolsa/pool orçamentário)
  vagasAmplaConcorrencia: number | null
  cotas: CotaConfig[]
  valorPorProjeto: number | null
  valorTotalCategoria: number
  destinoVagaDeCotaVazia?: DestinoVagaDeCotaVazia
}

/** Retorna as chaves de `cotasOptIn` que não existem nas cotas configuradas para `categoria`. */
export function invalidCotasOptIn(
  categoriasConfig: CategoriaConfig[] | null | undefined,
  categoria: string | null | undefined,
  cotasOptIn: string[],
): string[] {
  if (cotasOptIn.length === 0) return []
  const config = categoriasConfig?.find((c) => c.nome === categoria)
  const chavesValidas = new Set((config?.cotas ?? []).map((c) => c.key))
  return cotasOptIn.filter((key) => !chavesValidas.has(key))
}
