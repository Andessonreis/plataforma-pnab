import type { AvaliacaoInput } from '@shared/schemas/avaliacao.schema'

export function calcularNotaTotal(notas: AvaliacaoInput['notas']): number {
  const totalPeso = notas.reduce((acc, n) => acc + n.peso, 0)
  const total = totalPeso > 0 ? notas.reduce((acc, n) => acc + (n.nota * n.peso) / totalPeso, 0) : 0
  return parseFloat(total.toFixed(2))
}
