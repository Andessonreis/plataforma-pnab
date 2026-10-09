import { describe, it, expect } from 'vitest'
import { agruparPorAno } from '../agrupar-por-ano'

describe('linha do tempo do painel', () => {
  it('agrupa por ano em ordem crescente e deixa os sem ano no fim', () => {
    const grupos = agruparPorAno([
      { id: 'a', ano: 1985 },
      { id: 'b', ano: null },
      { id: 'c', ano: 1926 },
      { id: 'd', ano: 1985 },
    ])
    expect(grupos.map((g) => g.ano)).toEqual([1926, 1985, null])
    expect(grupos[1].eventos.map((e) => e.id)).toEqual(['a', 'd'])
  })

  it('lista vazia não gera grupo', () => {
    expect(agruparPorAno([])).toEqual([])
  })
})
