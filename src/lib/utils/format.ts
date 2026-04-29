import type { Decimal } from '@prisma/client/runtime/library'

/** Timezone padrão do sistema — Brasília (UTC-3, sem horário de verão desde 2019). */
export const TZ_BR = 'America/Sao_Paulo' as const

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 * Aceita number, string ou Prisma Decimal.
 *
 * @example formatCurrency(150000) => "R$ 150.000,00"
 */
export function formatCurrency(value: number | string | Decimal | null | undefined): string {
  if (value == null) return '—'

  const num = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(num)) return '—'

  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Converte uma string de data em Date interpretando datetime-local "nu"
 * (sem timezone, vindo de `<input type="datetime-local">`) como horário
 * de Brasília (UTC-03:00). Strings com `Z` ou offset explícito são respeitadas.
 *
 * Necessário porque o servidor Next.js roda em UTC: `new Date("2026-08-15T09:00")`
 * lá vira 9h UTC (= 6h BRT) em vez do 9h BRT que o usuário digitou.
 *
 * Brasil não adota mais horário de verão desde 2019, então `-03:00` fixo é seguro.
 */
export function parseBrazilDateTime(date: Date | string): Date {
  if (date instanceof Date) return date
  // Já tem timezone (Z ou ±HH:MM / ±HHMM) → respeita
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(date)) return new Date(date)
  // String "nua" do datetime-local → assume BRT
  return new Date(`${date}-03:00`)
}

/**
 * Formata uma data como dd/mm/aaaa.
 *
 * @example formatDate("2026-04-30T23:59:00") => "30/04/2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'

  const d = parseBrazilDateTime(date)

  if (Number.isNaN(d.getTime())) return '—'

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

/**
 * Remove tudo que não for dígito de uma string.
 * Útil pra normalizar telefones antes de salvar/validar.
 */
export function unmaskTelefone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

/**
 * Formata um telefone BR. Aceita string com ou sem máscara.
 * 10 dígitos → fixo "(77) 9999-0000"; 11 dígitos → celular "(77) 99999-0000".
 * Para inputs parciais (digitação em curso), formata o que conseguir.
 *
 * @example formatTelefoneBR("77999990000") => "(77) 99999-0000"
 * @example formatTelefoneBR("7733330000")  => "(77) 3333-0000"
 */
export function formatTelefoneBR(value: string): string {
  const d = unmaskTelefone(value)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  // 11 dígitos = celular com 9 na frente
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

/**
 * Formata uma data como dd/mm/aaaa HH:mm.
 *
 * @example formatDateTime("2026-04-30T23:59:00") => "30/04/2026 23:59"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'

  const d = parseBrazilDateTime(date)

  if (Number.isNaN(d.getTime())) return '—'

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}
