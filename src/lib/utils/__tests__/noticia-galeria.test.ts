import { describe, it, expect } from 'vitest'
import { statusDia, parseGaleria } from '../noticia-galeria'

describe('statusDia', () => {
  it('marca como hoje quando a data bate com o dia em UTC', () => {
    expect(statusDia('2026-08-09', new Date('2026-08-09T15:00:00Z'))).toBe('hoje')
  })

  it('continua "hoje" no fuso de Irecê mesmo já virado o dia em UTC (bug de produção)', () => {
    // 00:47 UTC de 10/08 é 21:47 de 09/08 em Irecê — servidor roda em UTC,
    // sem fixar o fuso o card do dia 09 lia como "passado" à noite.
    expect(statusDia('2026-08-09', new Date('2026-08-10T00:47:00Z'))).toBe('hoje')
  })

  it('marca como passado só depois da virada real do dia em Irecê', () => {
    // 03:00 UTC de 10/08 já é 00:00 de 10/08 em Irecê (UTC-3).
    expect(statusDia('2026-08-09', new Date('2026-08-10T03:00:00Z'))).toBe('passado')
  })

  it('marca como futuro uma data adiante', () => {
    expect(statusDia('2026-08-15', new Date('2026-08-09T15:00:00Z'))).toBe('futuro')
  })

  it('retorna null sem data', () => {
    expect(statusDia(null)).toBeNull()
  })
})

describe('parseGaleria', () => {
  it('aceita itens no formato esperado', () => {
    const json = [{ url: '/a.jpg', legenda: 'Show', data: '2026-08-09' }]
    expect(parseGaleria(json)).toEqual(json)
  })

  it('ignora itens fora do formato ou JSON que não é array', () => {
    expect(parseGaleria(null)).toEqual([])
    expect(parseGaleria('texto')).toEqual([])
    expect(parseGaleria([{ url: '/a.jpg' }])).toEqual([])
  })
})
