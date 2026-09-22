import type { PreviewRow, VagasConfig } from './types'

export type Tone = 'emerald' | 'amber' | 'red' | 'slate'
export type Faixa = { label: string; tone: Tone } | null

export const TONE_CLASS: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function faixa(pos: number, notaFinal: number, finalizadas: number, vagas: VagasConfig): Faixa {
  if (finalizadas === 0) return { label: 'Sem avaliação', tone: 'slate' }
  if (vagas.notaMinima != null && notaFinal < vagas.notaMinima) {
    return { label: 'Desclassificado', tone: 'amber' }
  }
  if (vagas.contemplados != null) {
    if (pos <= vagas.contemplados) return { label: 'Classificado', tone: 'emerald' }
    if (vagas.suplentes == null || pos <= vagas.contemplados + vagas.suplentes) {
      return { label: 'Suplente', tone: 'amber' }
    }
    return { label: 'Desclassificado', tone: 'amber' }
  }
  return null
}

export function faixaPorCategoria(r: PreviewRow, vagas: VagasConfig): Faixa {
  if (r.finalizadas === 0) return { label: 'Sem avaliação', tone: 'slate' }
  if (vagas.notaMinima != null && r.notaFinal < vagas.notaMinima) {
    return { label: 'Desclassificado', tone: 'amber' }
  }
  switch (r.statusPrevia) {
    case 'CONTEMPLADA': return { label: 'Classificado', tone: 'emerald' }
    case 'SUPLENTE': return { label: 'Suplente', tone: 'amber' }
    case 'NAO_CONTEMPLADA': return { label: 'Desclassificado', tone: 'amber' }
    default: return null
  }
}
