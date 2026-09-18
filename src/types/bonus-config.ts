// Itens de bonificação de um edital (Edital.itensBonus).
//
// Pontuação extra prevista no edital (ex.: Anexo VI do Festival de Arte e
// Cultura) que NÃO é critério de mérito: é fato documental, confirmado pela
// comissão a partir das autodeclarações entregues na habilitação.
//
// Por isso o bônus é somado UMA vez, em cima da média dos avaliadores, e nunca
// dentro da nota de cada avaliador — quando ele entra como critério, cada
// parecerista marca por conta própria e a média dilui o valor (quem tinha
// direito a 10 pontos recebia 3,33 se só um dos três marcasse).

export interface ItemBonusConfig {
  key: string
  label: string
  pontos: number
}

export interface ItensBonusConfig {
  /**
   * Teto de itens que somam pontos. O edital do Festival prevê "a pontuação
   * bônus deverá ser contemplada em até dois itens" → maxItens: 2.
   * null = sem teto.
   */
  maxItens: number | null
  itens: ItemBonusConfig[]
}

function isItemValido(raw: unknown): raw is ItemBonusConfig {
  if (typeof raw !== 'object' || raw === null) return false
  const item = raw as Record<string, unknown>
  return (
    typeof item.key === 'string' &&
    item.key.length > 0 &&
    typeof item.label === 'string' &&
    typeof item.pontos === 'number' &&
    Number.isFinite(item.pontos)
  )
}

/** Lê `Edital.itensBonus`. Retorna null quando o edital não usa bonificação. */
export function parseItensBonus(raw: unknown): ItensBonusConfig | null {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return null }
  }
  if (typeof data !== 'object' || data === null) return null

  const config = data as Record<string, unknown>
  const itens = Array.isArray(config.itens) ? config.itens.filter(isItemValido) : []
  if (itens.length === 0) return null

  const maxItens =
    typeof config.maxItens === 'number' && Number.isInteger(config.maxItens) && config.maxItens > 0
      ? config.maxItens
      : null

  return { maxItens, itens }
}

/** Itens configurados cujas chaves não existem no edital — usado na validação do que a comissão marcou. */
export function invalidBonusItens(config: ItensBonusConfig | null, bonusItens: string[]): string[] {
  if (bonusItens.length === 0) return []
  const chavesValidas = new Set((config?.itens ?? []).map((i) => i.key))
  return bonusItens.filter((key) => !chavesValidas.has(key))
}
