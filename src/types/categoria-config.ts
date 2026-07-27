// Vagas/cotas/valor por categoria de um edital (Edital.categoriasConfig).
// Ausente/vazio no edital = categorias tratadas só como rótulo (comportamento legado).

export interface CotaConfig {
  key: string
  label: string
  vagas: number
}

export interface CategoriaConfig {
  nome: string
  // null = sem limite discreto de vagas (ex.: categorias de pessoa jurídica
  // sem vaga fixa, só um valor total de bolsa/pool orçamentário)
  vagasAmplaConcorrencia: number | null
  cotas: CotaConfig[]
  valorPorProjeto: number | null
  valorTotalCategoria: number
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
