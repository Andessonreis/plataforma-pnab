/**
 * Datas do agendamento do Memorial.
 *
 * O dia da visita circula como texto "AAAA-MM-DD" (horário de Irecê) e só vira Date
 * na borda com o banco. A coluna `data` é @db.Date: o Prisma grava e devolve meia-noite
 * UTC, então a conversão usa sempre UTC e nunca o fuso da máquina. Irecê segue
 * America/Bahia, UTC-3 o ano todo (sem horário de verão).
 */

export const FUSO_MEMORIAL = 'America/Bahia'
const OFFSET_BAHIA = '-03:00'

const DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MES_REGEX = /^\d{4}-\d{2}$/

export function ehDiaValido(dia: string): boolean {
  if (!DIA_REGEX.test(dia)) return false
  const d = new Date(`${dia}T00:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dia
}

export function ehMesValido(mes: string): boolean {
  return MES_REGEX.test(mes) && ehDiaValido(`${mes}-01`)
}

/** Dia "AAAA-MM-DD" → Date no formato que o Prisma usa para @db.Date. */
export function diaParaDate(dia: string): Date {
  return new Date(`${dia}T00:00:00.000Z`)
}

/** Date vinda de coluna @db.Date → "AAAA-MM-DD". */
export function dateParaDia(data: Date): string {
  return data.toISOString().slice(0, 10)
}

/** Instante real em que a visita começa, no horário de Irecê. */
export function inicioDaVisita(dia: string, hora: string): Date {
  return new Date(`${dia}T${hora}:00${OFFSET_BAHIA}`)
}

/** 0 = domingo ... 6 = sábado. Meio-dia UTC evita qualquer virada de data. */
export function diaDaSemana(dia: string): number {
  return new Date(`${dia}T12:00:00.000Z`).getUTCDay()
}

/** Dia corrente em Irecê para um instante qualquer. */
export function diaEmIrece(instante: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_MEMORIAL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante)
}

export function somarDias(dia: string, dias: number): string {
  const d = diaParaDate(dia)
  d.setUTCDate(d.getUTCDate() + dias)
  return dateParaDia(d)
}

/** Todos os dias de `de` até `ate`, inclusive. */
export function diasEntre(de: string, ate: string): string[] {
  const dias: string[] = []
  for (let dia = de; dia <= ate; dia = somarDias(dia, 1)) dias.push(dia)
  return dias
}

export function intervaloDoMes(mes: string): { de: string; ate: string } {
  const de = `${mes}-01`
  const proximo = diaParaDate(de)
  proximo.setUTCMonth(proximo.getUTCMonth() + 1)
  return { de, ate: somarDias(dateParaDia(proximo), -1) }
}

/** "2026-10-09" → "sexta-feira, 9 de outubro de 2026" */
export function formatarDiaPorExtenso(dia: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(diaParaDate(dia))
}

/** "2026-10-09" → "09/10/2026" */
export function formatarDiaCurto(dia: string): string {
  const [ano, mes, d] = dia.split('-')
  return `${d}/${mes}/${ano}`
}
