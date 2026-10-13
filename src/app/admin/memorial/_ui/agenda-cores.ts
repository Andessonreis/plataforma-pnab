import type { MemorialStatusAgendamento } from '@prisma/client'

/**
 * Fundo dos blocos de visita no calendário e na semana. Segue o mesmo sentido das cores
 * do StatusChip (dourado = responder, turquesa = em análise, oliva = confirmada), em
 * tom de fundo para o bloco inteiro ser lido de longe. O texto da situação vai junto.
 */
export const BLOCO_VISITA: Record<MemorialStatusAgendamento, string> = {
  SOLICITADO: 'border-accent-400 bg-accent-200 text-accent-950',
  REAGENDAMENTO_SOLICITADO: 'border-accent-400 bg-accent-200 text-accent-950',
  EM_ANALISE: 'border-turquesa-300 bg-turquesa-50 text-turquesa-950',
  CONFIRMADO: 'border-oliva-300 bg-oliva-50 text-oliva-950',
  REALIZADO: 'border-oliva-200 bg-white text-oliva-900',
  RECUSADO: 'border-brand-200 bg-white text-brand-900 line-through decoration-brand-400',
  CANCELADO: 'border-ameixa-200 bg-white text-ameixa-800 line-through decoration-ameixa-400',
  NAO_COMPARECEU: 'border-ameixa-200 bg-white text-ameixa-800',
}
