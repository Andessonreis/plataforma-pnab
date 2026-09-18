import type { CategoriaConfig } from '@/types/categoria-config'
import type { ItensBonusConfig } from '@/types/bonus-config'

/**
 * Nota bônus — soma direto em cima da média dos avaliadores, sem afetar o
 * cálculo de cada avaliação individual.
 *
 * Duas origens, nesta ordem de precedência (ver calculateResults):
 * 1. `Edital.itensBonus` + `Inscricao.bonusItens` — itens de bonificação que a
 *    comissão validou (calcularBonusItens). É o caminho dos editais com Anexo
 *    de bonificação, onde o bônus não coincide com as cotas de vaga.
 * 2. `CategoriaConfig.cotas[].pontosBonus` + `Inscricao.cotasOptIn` — bônus
 *    colado na cota autodeclarada (calcularBonusCotas), usado pelos editais em
 *    que as duas coisas são a mesma.
 *
 * Nos dois casos confia na autodeclaração sem conferência extra: a inscrição já
 * passou pela habilitação documental pra chegar aqui.
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

/**
 * Soma os pontos dos itens de bonificação validados pela comissão, respeitando
 * o teto de itens do edital. Passando do teto, valem os de maior pontuação —
 * é o que favorece o proponente, e o edital não define outro desempate.
 * Chaves repetidas ou fora da config do edital não somam nada.
 */
export function calcularBonusItens(
  bonusItens: string[],
  config: ItensBonusConfig | undefined | null,
): number {
  if (!config || bonusItens.length === 0) return 0

  const pontosPorItem = new Map(config.itens.map((i) => [i.key, i.pontos]))
  const pontos = [...new Set(bonusItens)]
    .map((key) => pontosPorItem.get(key) ?? 0)
    .filter((p) => p > 0)
    .sort((a, b) => b - a)

  const considerados = config.maxItens == null ? pontos : pontos.slice(0, config.maxItens)
  return Math.round(considerados.reduce((total, p) => total + p, 0) * 100) / 100
}

/** Acha a config da categoria da inscrição dentro do array do edital (por nome). */
export function encontrarCategoriaConfig(
  categoriasConfig: CategoriaConfig[] | null | undefined,
  categoria: string | null,
): CategoriaConfig | undefined {
  if (!categoriasConfig || categoria === null) return undefined
  return categoriasConfig.find((c) => c.nome === categoria)
}
