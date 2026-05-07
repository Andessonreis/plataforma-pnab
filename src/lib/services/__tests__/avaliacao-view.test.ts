import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'
import { viewNotaTotal, formatNotaTotal } from '../avaliacao-view'

describe('viewNotaTotal', () => {
  it('retorna null quando finalizada=false', () => {
    expect(viewNotaTotal({ notaTotal: 7.5, finalizada: false })).toBeNull()
  })

  it('retorna null quando notaTotal=null mesmo com finalizada=true', () => {
    expect(viewNotaTotal({ notaTotal: null, finalizada: true })).toBeNull()
  })

  it('retorna null quando notaTotal=undefined', () => {
    expect(viewNotaTotal({ notaTotal: undefined, finalizada: true })).toBeNull()
  })

  it('retorna número quando finalizada=true e nota numérica', () => {
    expect(viewNotaTotal({ notaTotal: 8.5, finalizada: true })).toBe(8.5)
  })

  it('retorna 0 (e não null) quando avaliador realmente atribuiu nota 0', () => {
    expect(viewNotaTotal({ notaTotal: 0, finalizada: true })).toBe(0)
  })

  it('aceita Decimal do Prisma (string)', () => {
    expect(viewNotaTotal({ notaTotal: '9.57', finalizada: true })).toBe(9.57)
  })

  it('aceita Prisma.Decimal', () => {
    expect(viewNotaTotal({ notaTotal: new Prisma.Decimal('7.65'), finalizada: true })).toBe(7.65)
  })

  it('retorna null para valores inválidos', () => {
    expect(viewNotaTotal({ notaTotal: 'abc', finalizada: true })).toBeNull()
  })
})

describe('formatNotaTotal', () => {
  it("retorna 'Pendente' para placeholder", () => {
    expect(formatNotaTotal({ notaTotal: null, finalizada: false })).toBe('Pendente')
  })

  it("retorna 'Pendente' para rascunho não finalizado", () => {
    expect(formatNotaTotal({ notaTotal: 7.7, finalizada: false })).toBe('Pendente')
  })

  it('formata nota com 2 casas por padrão', () => {
    expect(formatNotaTotal({ notaTotal: 8.5, finalizada: true })).toBe('8.50')
  })

  it('aceita decimals customizado', () => {
    expect(formatNotaTotal({ notaTotal: 8.5, finalizada: true }, 1)).toBe('8.5')
  })

  it('formata 0 quando avaliação real foi zerada', () => {
    expect(formatNotaTotal({ notaTotal: 0, finalizada: true })).toBe('0.00')
  })
})
