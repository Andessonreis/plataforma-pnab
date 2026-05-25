/**
 * Geração mínima de CSV (RFC 4180-ish) sem dependências externas.
 * Excel/LibreOffice/Sheets abrem nativamente.
 *
 * Mitigação CSV injection: prefixa célula com aspa simples (`'`) quando
 * começa com `=`, `+`, `-`, `@`, `\t` ou `\r`. Essa é a recomendação OWASP
 * pra evitar que valores controlados por usuário virem fórmulas executáveis
 * no Excel.
 */

const RISKY_FIRST_CHARS = new Set(['=', '+', '-', '@', '\t', '\r'])

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str = String(value)

  if (str.length > 0 && RISKY_FIRST_CHARS.has(str[0]!)) {
    str = `'${str}`
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Serializa uma matriz [linha][coluna] em CSV.
 * BOM UTF-8 incluído pra Excel detectar encoding corretamente.
 */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  const bom = '﻿'
  const body = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
  return bom + body
}
