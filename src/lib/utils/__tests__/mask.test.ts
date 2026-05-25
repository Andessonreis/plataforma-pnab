import { describe, it, expect } from 'vitest'
import { maskCpfCnpj, maskName } from '../mask'

describe('maskCpfCnpj', () => {
  it('CPF cru (11 dígitos) → mascara 3 primeiros e 2 últimos', () => {
    expect(maskCpfCnpj('12345678901')).toBe('***.456.789-**')
  })

  it('CPF formatado é normalizado', () => {
    expect(maskCpfCnpj('123.456.789-01')).toBe('***.456.789-**')
  })

  it('CNPJ cru (14 dígitos) → mascara 2 primeiros e 2 últimos', () => {
    expect(maskCpfCnpj('12345678000190')).toBe('**.345.678/0001-**')
  })

  it('CNPJ formatado é normalizado', () => {
    expect(maskCpfCnpj('12.345.678/0001-90')).toBe('**.345.678/0001-**')
  })

  it('valor inválido (tamanho fora) → "—"', () => {
    expect(maskCpfCnpj('123')).toBe('—')
    expect(maskCpfCnpj('12345678901234567')).toBe('—')
  })

  it('nulo/undefined/vazio → "—"', () => {
    expect(maskCpfCnpj(null)).toBe('—')
    expect(maskCpfCnpj(undefined)).toBe('—')
    expect(maskCpfCnpj('')).toBe('—')
  })

  it('não vaza nenhum dos 3 primeiros dígitos do CPF nem dos 2 primeiros do CNPJ', () => {
    const cpfMasked = maskCpfCnpj('98765432101')
    expect(cpfMasked.startsWith('***.')).toBe(true)
    expect(cpfMasked).not.toMatch(/^987/)

    const cnpjMasked = maskCpfCnpj('98765432000190')
    expect(cnpjMasked.startsWith('**.')).toBe(true)
    expect(cnpjMasked).not.toMatch(/^98/)
  })
})

describe('maskName', () => {
  it('preserva primeiro e último termo', () => {
    expect(maskName('João da Silva Santos')).toBe('João *** Santos')
  })

  it('nome simples (uma palavra) → retorna como está', () => {
    expect(maskName('Maria')).toBe('Maria')
  })

  it('normaliza espaços múltiplos', () => {
    expect(maskName('João   Silva   Santos')).toBe('João *** Santos')
  })

  it('vazio/null/undefined → "—"', () => {
    expect(maskName('')).toBe('—')
    expect(maskName(null)).toBe('—')
    expect(maskName(undefined)).toBe('—')
  })
})
