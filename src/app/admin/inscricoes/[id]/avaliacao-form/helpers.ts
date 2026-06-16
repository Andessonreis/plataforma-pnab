import type { NotaItem } from './types'

export function notaColor(nota: number): string {
  if (nota >= 7) return 'text-emerald-700 bg-emerald-50'
  if (nota >= 5) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

export function totalColor(nota: number): string {
  if (nota >= 7) return 'text-emerald-700'
  if (nota >= 5) return 'text-amber-600'
  return 'text-red-600'
}

export function calcTotalWeighted(notas: NotaItem[]): number {
  const totalPeso = notas.reduce((acc, n) => acc + n.peso, 0)
  if (totalPeso === 0) return 0
  return notas.reduce((acc, n) => acc + (n.nota * n.peso) / totalPeso, 0)
}
