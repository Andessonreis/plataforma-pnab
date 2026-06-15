/**
 * Helpers de formatação compartilhados entre os geradores de PDF.
 * Extraídos de cópias byte-idênticas para um único módulo.
 */

/** Formata tipo de proponente. */
export function formatTipoProponente(tipo: string): string {
  const map: Record<string, string> = {
    PF: 'Pessoa Física',
    PJ: 'Pessoa Jurídica',
    MEI: 'Microempreendedor Individual (MEI)',
    COLETIVO: 'Coletivo Cultural',
  }
  return map[tipo] ?? tipo
}

/** Formata valor como moeda BRL. */
export function formatCurrency(value: unknown): string {
  const num = Number(value)
  if (isNaN(num)) return String(value)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Converte chave camelCase/snake_case em label legível. */
export function camelCaseToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}
