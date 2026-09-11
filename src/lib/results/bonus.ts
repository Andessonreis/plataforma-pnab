import type { CategoriaConfig } from '@/types/categoria-config'

/**
 * Nota bônus por cota autodeclarada — soma direto em cima da média dos
 * avaliadores, sem afetar o cálculo de cada avaliação individual.
 *
 * Confia em `cotasOptIn` sem conferência extra: a inscrição já passou pela
 * habilitação documental pra chegar aqui, então a autodeclaração já foi
 * conferida nesse processo.
 */

/** Soma os pontos das cotas de `cotasOptIn` presentes na config da categoria. Cotas repetidas ou sem `pontosBonus` não somam nada. */
export function calcularBonusCotas(
  cotasOptIn: string[],
  categoriaConfig: CategoriaConfig | undefined | null,
): number {
  if (!categoriaConfig || cotasOptIn.length === 0) return 0

  const pontosPorCota = new Map(categoriaConfig.cotas.map((c) => [c.key, c.pontosBonus ?? 0]))
  let total = 0
  for (const key of cotasOptIn) {
    total += pontosPorCota.get(key) ?? 0
  }
  return Math.round(total * 100) / 100
}

/** Acha a config da categoria da inscrição dentro do array do edital (por nome). */
export function encontrarCategoriaConfig(
  categoriasConfig: CategoriaConfig[] | null | undefined,
  categoria: string | null,
): CategoriaConfig | undefined {
  if (!categoriasConfig || categoria === null) return undefined
  return categoriasConfig.find((c) => c.nome === categoria)
}
