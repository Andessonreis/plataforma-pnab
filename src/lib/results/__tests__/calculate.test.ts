import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseCriterios,
  parseNotas,
  calculateWeightedAverage,
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
})
