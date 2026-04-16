import { describe, it, expect } from 'vitest'
import { isValidCnpj, isValidCpf } from '../document'

describe('isValidCnpj', () => {
  it('aceita CNPJ válido sem máscara', () => {
    expect(isValidCnpj('11222333000181')).toBe(true)
  })

  it('aceita CNPJ válido com máscara', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
  })

  it('aceita outro CNPJ válido (DV calculado)', () => {
    expect(isValidCnpj('99999999000191')).toBe(true)
  })

  it('rejeita dígito verificador errado', () => {
    expect(isValidCnpj('11222333000180')).toBe(false)
    expect(isValidCnpj('11222333000100')).toBe(false)
  })

  it('rejeita comprimento diferente de 14', () => {
    expect(isValidCnpj('12345678')).toBe(false)
    expect(isValidCnpj('123456789012345')).toBe(false)
    expect(isValidCnpj('')).toBe(false)
  })

  it('rejeita sequências repetidas', () => {
    expect(isValidCnpj('00000000000000')).toBe(false)
    expect(isValidCnpj('11111111111111')).toBe(false)
    expect(isValidCnpj('99999999999999')).toBe(false)
  })

  it('rejeita strings com letras', () => {
    expect(isValidCnpj('AB.CDE.FGH/IJKL-MN')).toBe(false)
  })
})

describe('isValidCpf', () => {
  it('aceita CPFs válidos conhecidos', () => {
    expect(isValidCpf('111.444.777-35')).toBe(true)
    expect(isValidCpf('11144477735')).toBe(true)
  })

  it('rejeita dígito verificador errado', () => {
    expect(isValidCpf('11144477736')).toBe(false)
    expect(isValidCpf('12345678900')).toBe(false)
  })

  it('rejeita comprimento errado', () => {
    expect(isValidCpf('1234567890')).toBe(false)
    expect(isValidCpf('123456789012')).toBe(false)
  })

  it('rejeita sequências repetidas', () => {
    expect(isValidCpf('00000000000')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('99999999999')).toBe(false)
  })
})
