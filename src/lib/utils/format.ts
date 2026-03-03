import type { Decimal } from '@prisma/client/runtime/library'

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
 * Formata uma data como dd/mm/aaaa.
 *
 * @example formatDate("2026-04-30T23:59:00") => "30/04/2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'

  const d = typeof date === 'string' ? new Date(date) : date

  if (Number.isNaN(d.getTime())) return '—'

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

/**
 * Formata uma data como dd/mm/aaaa HH:mm.
 *
 * @example formatDateTime("2026-04-30T23:59:00") => "30/04/2026 23:59"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'

  const d = typeof date === 'string' ? new Date(date) : date

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
