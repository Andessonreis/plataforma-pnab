// Validação de CPF/CNPJ por dígito verificador (módulo 11).
// Aceita entrada com máscara ou só dígitos.

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function allSameDigit(value: string): boolean {
  return /^(\d)\1+$/.test(value)
}

export function isValidCpf(cpf: string): boolean {
  const digits = onlyDigits(cpf)
  if (digits.length !== 11) return false
  if (allSameDigit(digits)) return false

  const calc = (slice: string, startFactor: number): number => {
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += Number(slice[i]) * (startFactor - i)
    }
    const mod = (sum * 10) % 11
    return mod === 10 ? 0 : mod
  }

  const d1 = calc(digits.slice(0, 9), 10)
  if (d1 !== Number(digits[9])) return false

  const d2 = calc(digits.slice(0, 10), 11)
  if (d2 !== Number(digits[10])) return false

  return true
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = onlyDigits(cnpj)
  if (digits.length !== 14) return false
  if (allSameDigit(digits)) return false

  const calc = (slice: string): number => {
    // Pesos da Receita: começam em 5 (ou 6 quando slice tem 13) e descem até 2, reiniciando em 9.
    const weights = slice.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += Number(slice[i]) * weights[i]
    }
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }

  const d1 = calc(digits.slice(0, 12))
  if (d1 !== Number(digits[12])) return false

  const d2 = calc(digits.slice(0, 13))
  if (d2 !== Number(digits[13])) return false

  return true
}
