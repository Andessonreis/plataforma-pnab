import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'

export const EMPTY_CRITERIO: CriterioAvaliacao = {
  criterio: '',
  peso: 1,
  notaMax: 10,
  bloco: '',
  modo: 'discreto',
  naoAtende: 0,
  parcial: 5,
  plenamente: 10,
}

export function parseCriterios(raw: unknown): CriterioAvaliacao[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

// Resumo por bloco
export function getBlocoSummary(criterios: CriterioAvaliacao[]) {
  const blocos = new Map<string, number>()
  for (const c of criterios) {
    const bloco = c.bloco || 'Geral'
    const max = c.modo === 'discreto' ? (c.plenamente ?? c.notaMax) : c.notaMax
    blocos.set(bloco, (blocos.get(bloco) ?? 0) + max)
  }
  return Array.from(blocos.entries())
}
