import { parseBrazilDateTime } from '@/lib/utils/format'

export interface UpcomingDeadline {
  editalId: string
  editalTitulo: string
  slug: string
  label: string
  dataHora: string
}

/** Ordena datas do cronograma (horário de Brasília) da mais próxima para a mais distante. */
export function compararDataHora(a: string, b: string): number {
  return parseBrazilDateTime(a).getTime() - parseBrazilDateTime(b).getTime()
}

/**
 * Texto de contagem regressiva curto. Arredonda pra cima pra não subestimar
 * prazo (faltando 23h ainda mostra "Falta 1 dia", não "Encerra hoje").
 */
export function contagemRegressiva(dataHora: string): string {
  const alvo = parseBrazilDateTime(dataHora)
  const dias = Math.ceil((alvo.getTime() - Date.now()) / 86_400_000)
  if (dias <= 0) return 'Encerra hoje'
  if (dias === 1) return 'Falta 1 dia'
  return `Faltam ${dias} dias`
}

/**
 * Dia e mês abreviado ("09", "out") de uma data, no fuso informado. Datas
 * de calendário puro (sem hora, como o dia de uma visita) vêm em UTC; prazos
 * de edital vêm no horário de Brasília.
 */
export function diaEMes(data: Date, timeZone: 'UTC' | 'America/Sao_Paulo'): { dia: string; mes: string } {
  const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone }).format(data)
  const mes = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone }).format(data).replace('.', '')
  return { dia, mes }
}
