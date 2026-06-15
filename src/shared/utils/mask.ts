/**
 * Máscaras LGPD-friendly para publicação pública de CPF/CNPJ.
 *
 * Padrão adotado (alinhado com gov.br):
 *   - CPF  (11 dígitos): ***.456.789-**   (oculta 3 primeiros e 2 últimos)
 *   - CNPJ (14 dígitos): **.345.678/0001-**  (oculta 2 primeiros e 2 últimos)
 *
 * Aceita entrada formatada ou só dígitos. Entrada inválida → '—'.
 */
export function maskCpfCnpj(value: string | null | undefined): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')

  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
  }

  if (digits.length === 14) {
    return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-**`
  }

  return '—'
}

/**
 * Máscara mínima de nome — preserva o primeiro e o último termo,
 * substitui o meio por "***". Reutilizada de /resultados para manter
 * apresentação consistente em todas as listas públicas.
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return parts[0] ?? '—'
  return `${parts[0]} *** ${parts[parts.length - 1]}`
}
