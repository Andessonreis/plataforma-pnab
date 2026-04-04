import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseCriterios,
  parseNotas,
  calculateWeightedAverage,
  calculateBlockScore,
  calculateCriterioScore,
  saveResults,
  calculateResults,
} from '../calculate'
import { prisma } from '@/lib/db'
import { CRITERIOS_AVALIACAO_PADRAO } from '@/lib/avaliacao-criterios'

const mockPrisma = vi.mocked(prisma)

describe('calculateWeightedAverage', () => {
  const criterios = [
    { criterio: 'A', peso: 1, notaMax: 10 },
    { criterio: 'B', peso: 1, notaMax: 10 },
  ]

  it('calcula média com pesos iguais', () => {
    const notas = [
      { criterio: 'A', nota: 8 },
      { criterio: 'B', nota: 6 },
    ]
    // (8/10*10*1 + 6/10*10*1) / 2 = (8+6)/2 = 7
    expect(calculateWeightedAverage(notas, criterios)).toBe(7)
  })

  it('calcula média com pesos diferentes', () => {
    const criteriosPeso = [
      { criterio: 'A', peso: 3, notaMax: 10 },
      { criterio: 'B', peso: 1, notaMax: 10 },
    ]
    const notas = [
      { criterio: 'A', nota: 10 },
      { criterio: 'B', nota: 6 },
    ]
    // (10*3 + 6*1) / 4 = 36/4 = 9
    expect(calculateWeightedAverage(notas, criteriosPeso)).toBe(9)
  })

  it('retorna 0 para notas vazias', () => {
    expect(calculateWeightedAverage([], criterios)).toBe(0)
  })

  it('normaliza corretamente quando notaMax != 10', () => {
    const criteriosMax5 = [
      { criterio: 'A', peso: 1, notaMax: 5 },
    ]
    const notas = [{ criterio: 'A', nota: 5 }]
    // (5/5)*10*1 / 1 = 10
    expect(calculateWeightedAverage(notas, criteriosMax5)).toBe(10)
  })
})

describe('calculateWeightedAverage com critérios customizados (blocos)', () => {
  it('funciona com critérios que têm bloco (campo ignorado no cálculo)', () => {
    const criterios = [
      { criterio: 'A', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
      { criterio: 'B', peso: 3, notaMax: 3, bloco: 'Bloco 1' },
      { criterio: 'C', peso: 5, notaMax: 5, bloco: 'Bloco 2' },
    ]
    const notas = [
      { criterio: 'A', nota: 10 },
      { criterio: 'B', nota: 3 },
      { criterio: 'C', nota: 5 },
    ]
    // Todos com nota máxima → normalizado para 10 cada
    // (10/10*10*10 + 3/3*10*3 + 5/5*10*5) / (10+3+5) = (100+30+50)/18 = 10
    expect(calculateWeightedAverage(notas, criterios)).toBe(10)
  })

  it('funciona com notaMax variados (2, 3, 4, 5, 10)', () => {
    const criterios = [
      { criterio: 'A', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
      { criterio: 'B', peso: 4, notaMax: 4, bloco: 'Bloco 2' },
    ]
    const notas = [
      { criterio: 'A', nota: 5 },  // 5/10 = 0.5 → 5.0 normalizado
      { criterio: 'B', nota: 2 },  // 2/4 = 0.5 → 5.0 normalizado
    ]
    // (5*10 + 5*4) / (10+4) = (50+20)/14 = 5
    expect(calculateWeightedAverage(notas, criterios)).toBe(5)
  })

  it('nota parcial com peso=notaMax preserva ranking correto', () => {
    const criterios = [
      { criterio: 'A', peso: 10, notaMax: 10, bloco: 'B1' },
      { criterio: 'B', peso: 3, notaMax: 3, bloco: 'B1' },
    ]
    const notas1 = [{ criterio: 'A', nota: 10 }, { criterio: 'B', nota: 0 }]
    const notas2 = [{ criterio: 'A', nota: 0 }, { criterio: 'B', nota: 3 }]

    const score1 = calculateWeightedAverage(notas1, criterios)
    const score2 = calculateWeightedAverage(notas2, criterios)

    // Candidato 1: nota bruta 10+0=10, Candidato 2: nota bruta 0+3=3
    // score1 deve ser maior que score2
    expect(score1).toBeGreaterThan(score2)
  })
})

describe('parseCriterios', () => {
  it('parse JSON string válido', () => {
    const input = JSON.stringify([{ criterio: 'X', peso: 2, notaMax: 10 }])
    const result = parseCriterios(input)
    expect(result).toEqual([{ criterio: 'X', peso: 2, notaMax: 10 }])
  })

  it('string inválida retorna padrão', () => {
    const result = parseCriterios('invalid json')
    expect(result).toEqual([...CRITERIOS_AVALIACAO_PADRAO])
  })

  it('array vazio retorna padrão', () => {
    const result = parseCriterios([])
    expect(result).toEqual([...CRITERIOS_AVALIACAO_PADRAO])
  })

  it('null retorna padrão', () => {
    const result = parseCriterios(null)
    expect(result).toEqual([...CRITERIOS_AVALIACAO_PADRAO])
  })

  it('critérios com bloco são preservados no parse', () => {
    const input = JSON.stringify([
      { criterio: 'X', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
      { criterio: 'Y', peso: 5, notaMax: 5, bloco: 'Bloco 2', descricao: 'Teste' },
    ])
    const result = parseCriterios(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ criterio: 'X', bloco: 'Bloco 1' })
    expect(result[1]).toMatchObject({ criterio: 'Y', bloco: 'Bloco 2', descricao: 'Teste' })
  })
})

describe('parseNotas', () => {
  it('parse JSON string válido', () => {
    const input = JSON.stringify([{ criterio: 'A', nota: 8 }])
    const result = parseNotas(input)
    expect(result).toEqual([{ criterio: 'A', nota: 8 }])
  })

  it('string inválida retorna []', () => {
    expect(parseNotas('bad json')).toEqual([])
  })

  it('null retorna []', () => {
    expect(parseNotas(null)).toEqual([])
  })
})

describe('saveResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.inscricao.update.mockResolvedValue({} as never)
    mockPrisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops))
  })

  it('RESULTADO_PRELIMINAR mantém status da fase', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 8, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_PRELIMINAR')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { notaFinal: 8, status: 'RESULTADO_PRELIMINAR' },
    })
  })

  it('RESULTADO_FINAL sem vagas → todos CONTEMPLADA', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 8, totalAvaliacoes: 2 },
      { inscricaoId: '2', proponenteNome: 'Bob', categoria: null, notaFinal: 6, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 8, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '2' }, data: { notaFinal: 6, status: 'CONTEMPLADA' } }),
    )
  })

  it('RESULTADO_FINAL com vagas=2, 5 inscrições → 2 CONTEMPLADA, 3 SUPLENTE', async () => {
    const resultados = Array.from({ length: 5 }, (_, i) => ({
      inscricaoId: `${i + 1}`,
      proponenteNome: `Pessoa ${i + 1}`,
      categoria: null,
      notaFinal: 10 - i,
      totalAvaliacoes: 2,
    }))

    await saveResults(resultados, 'RESULTADO_FINAL', { contemplados: 2 })

    // Posições 1-2: CONTEMPLADA
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 10, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '2' }, data: { notaFinal: 9, status: 'CONTEMPLADA' } }),
    )
    // Posições 3-5: SUPLENTE (sem limite de suplentes)
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '3' }, data: { notaFinal: 8, status: 'SUPLENTE' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '5' }, data: { notaFinal: 6, status: 'SUPLENTE' } }),
    )
  })

  it('RESULTADO_FINAL com vagas=2, suplentes=1 → 2 CONTEMPLADA, 1 SUPLENTE, 2 NAO_CONTEMPLADA', async () => {
    const resultados = Array.from({ length: 5 }, (_, i) => ({
      inscricaoId: `${i + 1}`,
      proponenteNome: `Pessoa ${i + 1}`,
      categoria: null,
      notaFinal: 10 - i,
      totalAvaliacoes: 2,
    }))

    await saveResults(resultados, 'RESULTADO_FINAL', { contemplados: 2, suplentes: 1 })

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 10, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '3' }, data: { notaFinal: 8, status: 'SUPLENTE' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '4' }, data: { notaFinal: 7, status: 'NAO_CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '5' }, data: { notaFinal: 6, status: 'NAO_CONTEMPLADA' } }),
    )
  })

  it('nota 0 → sempre NAO_CONTEMPLADA', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 0, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 0, status: 'NAO_CONTEMPLADA' } }),
    )
  })

  it('totalAvaliacoes=0 → NAO_CONTEMPLADA', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 0, totalAvaliacoes: 0 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 0, status: 'NAO_CONTEMPLADA' } }),
    )
  })

  it('notaMinima → nota abaixo do mínimo recebe NAO_CONTEMPLADA', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 5, totalAvaliacoes: 2 },
      { inscricaoId: '2', proponenteNome: 'Bob', categoria: null, notaFinal: 2, totalAvaliacoes: 2 },
      { inscricaoId: '3', proponenteNome: 'Carlos', categoria: null, notaFinal: 3, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL', { notaMinima: 3 })

    // Ana (5) → acima da nota mínima → CONTEMPLADA
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 5, status: 'CONTEMPLADA' } }),
    )
    // Bob (2) → abaixo da nota mínima → NAO_CONTEMPLADA
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '2' }, data: { notaFinal: 2, status: 'NAO_CONTEMPLADA' } }),
    )
    // Carlos (3) → igual à nota mínima → CONTEMPLADA (>= mínimo)
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '3' }, data: { notaFinal: 3, status: 'CONTEMPLADA' } }),
    )
  })

  it('notaMinima com vagas → nota abaixo do mínimo não ocupa vaga', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 8, totalAvaliacoes: 2 },
      { inscricaoId: '2', proponenteNome: 'Bob', categoria: null, notaFinal: 5, totalAvaliacoes: 2 },
      { inscricaoId: '3', proponenteNome: 'Carlos', categoria: null, notaFinal: 2, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL', { contemplados: 2, notaMinima: 4 })

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 8, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '2' }, data: { notaFinal: 5, status: 'CONTEMPLADA' } }),
    )
    // Carlos (2) → abaixo da nota mínima → NAO_CONTEMPLADA (independente de ter vaga)
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '3' }, data: { notaFinal: 2, status: 'NAO_CONTEMPLADA' } }),
    )
  })

  it('sem notaMinima → comportamento anterior preservado', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 2, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL')

    // Sem nota mínima, nota >0 → CONTEMPLADA
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 2, status: 'CONTEMPLADA' } }),
    )
  })
})

describe('calculateBlockScore', () => {
  const criterios = [
    { criterio: 'A', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
    { criterio: 'B', peso: 3, notaMax: 3, bloco: 'Bloco 1' },
    { criterio: 'C', peso: 5, notaMax: 5, bloco: 'Bloco 2' },
  ]

  it('calcula score de um bloco específico', () => {
    const notas = [
      { criterio: 'A', nota: 10 },
      { criterio: 'B', nota: 3 },
      { criterio: 'C', nota: 5 },
    ]
    // Bloco 1: (10/10*10*10 + 3/3*10*3) / 13 = (100+30)/13 = 10
    expect(calculateBlockScore(notas, criterios, 'Bloco 1')).toBe(10)
    // Bloco 2: (5/5*10*5) / 5 = 50/5 = 10
    expect(calculateBlockScore(notas, criterios, 'Bloco 2')).toBe(10)
  })

  it('retorna 0 para bloco inexistente', () => {
    const notas = [{ criterio: 'A', nota: 10 }]
    expect(calculateBlockScore(notas, criterios, 'Bloco Inexistente')).toBe(0)
  })
})

describe('calculateCriterioScore', () => {
  const criterios = [
    { criterio: 'A', peso: 1, notaMax: 10 },
    { criterio: 'B', peso: 1, notaMax: 5 },
  ]

  it('calcula score de um critério individual', () => {
    const notas = [{ criterio: 'A', nota: 7 }, { criterio: 'B', nota: 3 }]
    expect(calculateCriterioScore(notas, criterios, 'A')).toBe(7)
    // B: 3/5*10 = 6
    expect(calculateCriterioScore(notas, criterios, 'B')).toBe(6)
  })

  it('retorna 0 para critério inexistente', () => {
    const notas = [{ criterio: 'A', nota: 7 }]
    expect(calculateCriterioScore(notas, criterios, 'Z')).toBe(0)
  })
})

describe('calculateResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ordena por nota descendente', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: JSON.stringify([{ criterio: 'A', peso: 1, notaMax: 10 }]),
    } as never)

    mockPrisma.inscricao.findMany.mockResolvedValue([
      {
        id: '1',
        proponente: { nome: 'Ana' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 5 }]), notaTotal: 5 }],
      },
      {
        id: '2',
        proponente: { nome: 'Bob' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 9 }]), notaTotal: 9 }],
      },
    ] as never)

    const results = await calculateResults('edital-1')

    expect(results[0].proponenteNome).toBe('Bob')
    expect(results[0].notaFinal).toBe(9)
    expect(results[1].proponenteNome).toBe('Ana')
    expect(results[1].notaFinal).toBe(5)
  })

  it('desempate por bloco resolve empate', async () => {
    const criterios = [
      { criterio: 'C1', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
      { criterio: 'C2', peso: 10, notaMax: 10, bloco: 'Bloco 2' },
    ]
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: JSON.stringify(criterios),
    } as never)

    // Ana: C1=10, C2=4 → notaFinal=7, Bloco1=10, Bloco2=4
    // Bob: C1=4, C2=10 → notaFinal=7, Bloco1=4, Bloco2=10
    mockPrisma.inscricao.findMany.mockResolvedValue([
      {
        id: '1',
        proponente: { nome: 'Ana' },
        categoria: null,
        avaliacoes: [{
          notas: JSON.stringify([{ criterio: 'C1', nota: 10 }, { criterio: 'C2', nota: 4 }]),
          notaTotal: 7,
        }],
      },
      {
        id: '2',
        proponente: { nome: 'Bob' },
        categoria: null,
        avaliacoes: [{
          notas: JSON.stringify([{ criterio: 'C1', nota: 4 }, { criterio: 'C2', nota: 10 }]),
          notaTotal: 7,
        }],
      },
    ] as never)

    const desempateRules = [
      { descricao: 'Maior nota no Bloco 1', tipo: 'bloco' as const, ref: 'Bloco 1', direcao: 'desc' as const },
    ]

    const results = await calculateResults('edital-1', desempateRules)

    // Mesma nota final (7), mas Ana tem Bloco 1=10 vs Bob Bloco 1=4
    expect(results[0].proponenteNome).toBe('Ana')
    expect(results[1].proponenteNome).toBe('Bob')
    expect(results[0].scoresBlocos).toBeDefined()
    expect(results[0].scoresBlocos!['Bloco 1']).toBe(10)
  })

  it('sem regras de desempate → scoresBlocos undefined', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: JSON.stringify([{ criterio: 'A', peso: 1, notaMax: 10 }]),
    } as never)

    mockPrisma.inscricao.findMany.mockResolvedValue([
      {
        id: '1',
        proponente: { nome: 'Ana' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 8 }]), notaTotal: 8 }],
      },
    ] as never)

    const results = await calculateResults('edital-1')

    expect(results[0].scoresBlocos).toBeUndefined()
  })
})
