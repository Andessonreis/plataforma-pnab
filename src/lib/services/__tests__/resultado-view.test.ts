import { describe, it, expect } from 'vitest'
import { podeVerBonus, viewNotaFinal } from '../resultado-view'

describe('podeVerBonus', () => {
  it('SUPER_ADMIN sempre ve, independente do flag', () => {
    expect(podeVerBonus('SUPER_ADMIN', false)).toBe(true)
    expect(podeVerBonus('SUPER_ADMIN', true)).toBe(true)
  })

  it('ADMIN so ve quando o edital libera', () => {
    expect(podeVerBonus('ADMIN', false)).toBe(false)
    expect(podeVerBonus('ADMIN', true)).toBe(true)
  })

  it('AVALIADOR nunca ve, mesmo com flag ligado', () => {
    expect(podeVerBonus('AVALIADOR', true)).toBe(false)
  })
})

describe('viewNotaFinal', () => {
  it('retorna null quando notaFinal e null', () => {
    expect(viewNotaFinal({ notaFinal: null, notaBonus: null }, 'SUPER_ADMIN', true)).toBeNull()
  })

  it('SUPER_ADMIN ve a nota completa (com bonus)', () => {
    const nota = viewNotaFinal({ notaFinal: 8.5, notaBonus: 2 }, 'SUPER_ADMIN', false)
    expect(nota).toBe(8.5)
  })

  it('AVALIADOR recebe a nota sem o bonus', () => {
    const nota = viewNotaFinal({ notaFinal: 8.5, notaBonus: 2 }, 'AVALIADOR', true)
    expect(nota).toBe(6.5)
  })

  it('ADMIN sem liberacao recebe a nota sem o bonus', () => {
    const nota = viewNotaFinal({ notaFinal: 8.5, notaBonus: 2 }, 'ADMIN', false)
    expect(nota).toBe(6.5)
  })

  it('ADMIN com liberacao ve a nota completa', () => {
    const nota = viewNotaFinal({ notaFinal: 8.5, notaBonus: 2 }, 'ADMIN', true)
    expect(nota).toBe(8.5)
  })

  it('sem bonus gravado, subtrai zero', () => {
    const nota = viewNotaFinal({ notaFinal: 8.5, notaBonus: null }, 'AVALIADOR', false)
    expect(nota).toBe(8.5)
  })

  it('aceita notaFinal/notaBonus como string (Decimal do Prisma serializado)', () => {
    const nota = viewNotaFinal({ notaFinal: '110.00', notaBonus: '5.00' }, 'AVALIADOR', false)
    expect(nota).toBe(105)
  })
})
