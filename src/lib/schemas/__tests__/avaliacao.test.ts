import { describe, it, expect } from 'vitest'
import { notaItemSchema, avaliacaoBodySchema } from '@/lib/schemas/avaliacao'

describe('notaItemSchema', () => {
  it('aceita item válido', () => {
    const result = notaItemSchema.safeParse({ criterio: 'Relevância', nota: 8, peso: 25 })
    expect(result.success).toBe(true)
  })

  it('aceita nota nos limites (0 e 10)', () => {
    expect(notaItemSchema.safeParse({ criterio: 'x', nota: 0, peso: 1 }).success).toBe(true)
    expect(notaItemSchema.safeParse({ criterio: 'x', nota: 10, peso: 1 }).success).toBe(true)
  })

  it('rejeita critério vazio', () => {
    const result = notaItemSchema.safeParse({ criterio: '', nota: 5, peso: 10 })
    expect(result.success).toBe(false)
  })

  it('rejeita nota acima de 10', () => {
    const result = notaItemSchema.safeParse({ criterio: 'x', nota: 11, peso: 10 })
    expect(result.success).toBe(false)
  })

  it('rejeita nota negativa', () => {
    const result = notaItemSchema.safeParse({ criterio: 'x', nota: -1, peso: 10 })
    expect(result.success).toBe(false)
  })

  it('rejeita peso acima de 100', () => {
    const result = notaItemSchema.safeParse({ criterio: 'x', nota: 5, peso: 101 })
    expect(result.success).toBe(false)
  })

  it('rejeita peso negativo', () => {
    const result = notaItemSchema.safeParse({ criterio: 'x', nota: 5, peso: -1 })
    expect(result.success).toBe(false)
  })

  it('rejeita nota como string', () => {
    const result = notaItemSchema.safeParse({ criterio: 'x', nota: '5', peso: 10 })
    expect(result.success).toBe(false)
  })
})

describe('avaliacaoBodySchema', () => {
  it('aceita body válido com finalizar default false', () => {
    const result = avaliacaoBodySchema.safeParse({
      notas: [{ criterio: 'c1', nota: 7, peso: 10 }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.finalizar).toBe(false)
    }
  })

  it('aceita body com parecer e finalizar=true', () => {
    const result = avaliacaoBodySchema.safeParse({
      notas: [{ criterio: 'c1', nota: 9, peso: 10 }],
      parecer: 'Projeto sólido e bem estruturado.',
      finalizar: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita array de notas vazio', () => {
    const result = avaliacaoBodySchema.safeParse({ notas: [] })
    expect(result.success).toBe(false)
  })

  it('rejeita notas ausentes', () => {
    const result = avaliacaoBodySchema.safeParse({ parecer: 'abc' })
    expect(result.success).toBe(false)
  })

  it('rejeita item de nota inválido dentro do array', () => {
    const result = avaliacaoBodySchema.safeParse({
      notas: [{ criterio: 'c1', nota: 15, peso: 10 }],
    })
    expect(result.success).toBe(false)
  })
})
