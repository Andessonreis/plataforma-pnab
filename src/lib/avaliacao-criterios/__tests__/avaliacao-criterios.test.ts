import { describe, it, expect } from 'vitest'
import { CRITERIOS_AVALIACAO_PADRAO, type CriterioAvaliacao } from '@/lib/avaliacao-criterios'

describe('CriterioAvaliacao type', () => {
  it('critérios padrão PNAB têm 5 itens', () => {
    expect(CRITERIOS_AVALIACAO_PADRAO).toHaveLength(5)
  })

  it('cada critério padrão tem criterio, peso, notaMax', () => {
    for (const c of CRITERIOS_AVALIACAO_PADRAO) {
      expect(c.criterio).toBeTruthy()
      expect(typeof c.peso).toBe('number')
      expect(typeof c.notaMax).toBe('number')
    }
  })

  it('critérios padrão não possuem bloco (retrocompatível)', () => {
    for (const c of CRITERIOS_AVALIACAO_PADRAO) {
      expect(c).not.toHaveProperty('bloco')
    }
  })

  it('soma dos pesos padrão é 100', () => {
    const total = CRITERIOS_AVALIACAO_PADRAO.reduce((s, c) => s + c.peso, 0)
    expect(total).toBe(100)
  })

  it('aceita bloco como campo opcional', () => {
    const criterio: CriterioAvaliacao = {
      criterio: 'Teste',
      peso: 10,
      notaMax: 5,
      bloco: 'Bloco 1 — Atuação',
    }
    expect(criterio.bloco).toBe('Bloco 1 — Atuação')
  })

  it('aceita critério sem bloco', () => {
    const criterio: CriterioAvaliacao = {
      criterio: 'Teste',
      peso: 10,
      notaMax: 5,
    }
    expect(criterio.bloco).toBeUndefined()
  })

  it('aceita descricao como campo opcional', () => {
    const comDesc: CriterioAvaliacao = {
      criterio: 'Teste',
      peso: 10,
      notaMax: 5,
      descricao: 'Texto de ajuda',
    }
    const semDesc: CriterioAvaliacao = {
      criterio: 'Teste',
      peso: 10,
      notaMax: 5,
    }
    expect(comDesc.descricao).toBe('Texto de ajuda')
    expect(semDesc.descricao).toBeUndefined()
  })
})

describe('criteriosAvaliacao customizados (Cultura Viva)', () => {
  const criteriosCulturaViva: CriterioAvaliacao[] = [
    { bloco: 'Bloco 1', criterio: '1a) Representa iniciativas culturais', notaMax: 10, peso: 10 },
    { bloco: 'Bloco 1', criterio: '1b) Promove criação artística', notaMax: 3, peso: 3 },
    { bloco: 'Bloco 2-I', criterio: '2I-a) Cidadania cultural', notaMax: 5, peso: 5 },
    { bloco: 'Bloco 2-II', criterio: '2II-a) Capacidade técnica', notaMax: 4, peso: 4 },
    { bloco: 'Bloco 3', criterio: 'Bonificação', notaMax: 5, peso: 5, descricao: 'Autodeclaração' },
  ]

  it('critérios com bloco agrupam corretamente', () => {
    const grupos: Record<string, CriterioAvaliacao[]> = {}
    for (const c of criteriosCulturaViva) {
      const bloco = c.bloco || 'Geral'
      if (!grupos[bloco]) grupos[bloco] = []
      grupos[bloco].push(c)
    }

    expect(Object.keys(grupos)).toEqual(['Bloco 1', 'Bloco 2-I', 'Bloco 2-II', 'Bloco 3'])
    expect(grupos['Bloco 1']).toHaveLength(2)
    expect(grupos['Bloco 2-I']).toHaveLength(1)
    expect(grupos['Bloco 2-II']).toHaveLength(1)
    expect(grupos['Bloco 3']).toHaveLength(1)
  })

  it('critérios sem bloco agrupam em "Geral"', () => {
    const semBloco: CriterioAvaliacao[] = [
      { criterio: 'A', peso: 25, notaMax: 10 },
      { criterio: 'B', peso: 25, notaMax: 10 },
    ]

    const grupos: Record<string, CriterioAvaliacao[]> = {}
    for (const c of semBloco) {
      const bloco = c.bloco || 'Geral'
      if (!grupos[bloco]) grupos[bloco] = []
      grupos[bloco].push(c)
    }

    expect(Object.keys(grupos)).toEqual(['Geral'])
    expect(grupos['Geral']).toHaveLength(2)
  })

  it('notaMax pode ser diferente de 10 (2, 3, 4, 5, 10)', () => {
    const maxValues = criteriosCulturaViva.map(c => c.notaMax)
    expect(maxValues).toContain(10)
    expect(maxValues).toContain(3)
    expect(maxValues).toContain(5)
    expect(maxValues).toContain(4)
  })
})
