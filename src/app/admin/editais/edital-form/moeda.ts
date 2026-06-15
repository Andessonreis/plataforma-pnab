/**
 * Formata valor monetário em reais conforme o usuário digita.
 * "50000" → "50.000", "50000,5" → "50.000,5", "50000,50" → "50.000,50".
 * Decimais limitados a 2 casas.
 *
 * Por que não tratar como centavos: o admin tende a digitar o valor em
 * reais diretamente — interpretar "50000" como "R$ 500,00" causa risco de
 * publicar edital com valor 100× menor que o pretendido.
 */
export function formatarMoeda(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '')
  if (!cleaned) return ''

  const firstComma = cleaned.indexOf(',')
  const intRaw = (firstComma === -1 ? cleaned : cleaned.slice(0, firstComma)).replace(/\D/g, '')
  const decRaw = firstComma === -1 ? null : cleaned.slice(firstComma + 1).replace(/\D/g, '').slice(0, 2)

  if (!intRaw && decRaw === null) return ''

  const intFormatted = parseInt(intRaw || '0', 10).toLocaleString('pt-BR')
  return decRaw === null ? intFormatted : `${intFormatted},${decRaw}`
}

/** Ao sair do campo, completa para 2 casas: "1.500" → "1.500,00", "1.500,5" → "1.500,50" */
export function normalizarMoedaOnBlur(value: string): string {
  if (!value) return ''
  const [intPart, decPart = ''] = value.split(',')
  return `${intPart},${(decPart + '00').slice(0, 2)}`
}

/** Converte "1500.00" (do banco) para "1.500,00" (exibição). */
export function valorTotalInicial(valorTotal: string | undefined): string {
  if (!valorTotal) return ''
  const num = parseFloat(String(valorTotal).replace(',', '.'))
  return isNaN(num) ? '' : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
