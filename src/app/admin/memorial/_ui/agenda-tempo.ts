import { diaEmIrece, diaParaDate } from '@/lib/memorial/agendamento/datas'

const UM_DIA = 86_400_000

/** Dias corridos entre dois dias "AAAA-MM-DD" (positivo quando `ate` vem depois). */
export function diasEntreDias(de: string, ate: string): number {
  return Math.round((diaParaDate(ate).getTime() - diaParaDate(de).getTime()) / UM_DIA)
}

/** Há quanto tempo o pedido chegou, contado em dias de Irecê. */
export function chegouHa(criadoEm: Date | string, agora = new Date()): string {
  const dias = diasEntreDias(diaEmIrece(new Date(criadoEm)), diaEmIrece(agora))
  if (dias <= 0) return 'Chegou hoje'
  if (dias === 1) return 'Chegou ontem'
  return `Chegou há ${dias} dias`
}

/** "hoje", "amanhã" ou "em N dias" para a data da visita. Vazio quando já passou. */
export function faltaPara(dia: string, hoje: string): string {
  const dias = diasEntreDias(hoje, dia)
  if (dias < 0) return ''
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  return `em ${dias} dias`
}
