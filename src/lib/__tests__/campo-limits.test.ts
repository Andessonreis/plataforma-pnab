import { describe, it, expect } from 'vitest'
import { resolveCharLimits, CHAR_LIMIT_DEFAULTS, CHAR_LIMIT_TYPES } from '../campo-limits'

describe('resolveCharLimits', () => {
  it('retorna defaults para campo texto sem override', () => {
    const result = resolveCharLimits({ tipo: 'texto' })

    expect(result).toEqual({ minLength: 0, maxLength: 200 })
  })

  it('retorna defaults para campo textarea sem override', () => {
    const result = resolveCharLimits({ tipo: 'textarea' })

    expect(result).toEqual({ minLength: 0, maxLength: 2000 })
  })

  it('retorna defaults para campo numero sem override', () => {
    const result = resolveCharLimits({ tipo: 'numero' })

    expect(result).toEqual({ minLength: 0, maxLength: 20 })
  })

  it('aliases text/number funcionam igual', () => {
    expect(resolveCharLimits({ tipo: 'text' })).toEqual({ minLength: 0, maxLength: 200 })
    expect(resolveCharLimits({ tipo: 'number' })).toEqual({ minLength: 0, maxLength: 20 })
  })

  it('usa override de maxLength quando fornecido', () => {
    const result = resolveCharLimits({ tipo: 'texto', maxLength: 500 })

    expect(result).toEqual({ minLength: 0, maxLength: 500 })
  })

  it('usa override de minLength quando fornecido', () => {
    const result = resolveCharLimits({ tipo: 'textarea', minLength: 50 })

    expect(result).toEqual({ minLength: 50, maxLength: 2000 })
  })

  it('usa ambos overrides quando fornecidos', () => {
    const result = resolveCharLimits({ tipo: 'texto', minLength: 10, maxLength: 100 })

    expect(result).toEqual({ minLength: 10, maxLength: 100 })
  })

  it('null em maxLength usa default', () => {
    const result = resolveCharLimits({ tipo: 'texto', maxLength: null })

    expect(result).toEqual({ minLength: 0, maxLength: 200 })
  })

  it('null em minLength usa default', () => {
    const result = resolveCharLimits({ tipo: 'textarea', minLength: null })

    expect(result).toEqual({ minLength: 0, maxLength: 2000 })
  })

  it('retorna null para tipo select', () => {
    expect(resolveCharLimits({ tipo: 'select' })).toBeNull()
  })

  it('retorna null para tipo data', () => {
    expect(resolveCharLimits({ tipo: 'data' })).toBeNull()
  })

  it('retorna null para tipo date', () => {
    expect(resolveCharLimits({ tipo: 'date' })).toBeNull()
  })

  it('retorna null para tipo arquivo', () => {
    expect(resolveCharLimits({ tipo: 'arquivo' })).toBeNull()
  })

  it('retorna null para tipo moeda', () => {
    expect(resolveCharLimits({ tipo: 'moeda' })).toBeNull()
  })

  it('retorna null para tipo currency', () => {
    expect(resolveCharLimits({ tipo: 'currency' })).toBeNull()
  })

  it('retorna null para tipo desconhecido', () => {
    expect(resolveCharLimits({ tipo: 'xyz' })).toBeNull()
  })
})

describe('CHAR_LIMIT_DEFAULTS', () => {
  it('contém defaults para todos os tipos suportados', () => {
    for (const tipo of CHAR_LIMIT_TYPES) {
      expect(CHAR_LIMIT_DEFAULTS[tipo]).toBeDefined()
      expect(CHAR_LIMIT_DEFAULTS[tipo].minLength).toBeGreaterThanOrEqual(0)
      expect(CHAR_LIMIT_DEFAULTS[tipo].maxLength).toBeGreaterThan(0)
    }
  })
})

describe('CHAR_LIMIT_TYPES', () => {
  it('contém os tipos esperados', () => {
    expect(CHAR_LIMIT_TYPES.has('texto')).toBe(true)
    expect(CHAR_LIMIT_TYPES.has('text')).toBe(true)
    expect(CHAR_LIMIT_TYPES.has('textarea')).toBe(true)
    expect(CHAR_LIMIT_TYPES.has('numero')).toBe(true)
    expect(CHAR_LIMIT_TYPES.has('number')).toBe(true)
  })

  it('não contém tipos não suportados', () => {
    expect(CHAR_LIMIT_TYPES.has('select')).toBe(false)
    expect(CHAR_LIMIT_TYPES.has('data')).toBe(false)
    expect(CHAR_LIMIT_TYPES.has('arquivo')).toBe(false)
    expect(CHAR_LIMIT_TYPES.has('moeda')).toBe(false)
  })
})
