import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseCriterios,
  parseNotas,
  calculateWeightedAverage,
  calculateBlockSum,
  calculateWithFormula,
  evaluateExpression,
  saveResults,
  calculateResults,
  saveManualOrder,
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
    expect(calculateWeightedAverage(notas, criterios)).toBe(10)
  })

  it('funciona com notaMax variados (2, 3, 4, 5, 10)', () => {
    const criterios = [
      { criterio: 'A', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
      { criterio: 'B', peso: 4, notaMax: 4, bloco: 'Bloco 2' },
    ]
    const notas = [
      { criterio: 'A', nota: 5 },
      { criterio: 'B', nota: 2 },
    ]
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

  it('RESULTADO_PRELIMINAR mantém status da fase e salva posicao', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 8, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_PRELIMINAR')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { notaFinal: 8, posicao: 1, status: 'RESULTADO_PRELIMINAR' },
    })
  })

  it('RESULTADO_FINAL sem vagas → todos CONTEMPLADA', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 8, totalAvaliacoes: 2 },
      { inscricaoId: '2', proponenteNome: 'Bob', categoria: null, notaFinal: 6, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 8, posicao: 1, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '2' }, data: { notaFinal: 6, posicao: 2, status: 'CONTEMPLADA' } }),
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

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 10, posicao: 1, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '2' }, data: { notaFinal: 9, posicao: 2, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '3' }, data: { notaFinal: 8, posicao: 3, status: 'SUPLENTE' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '5' }, data: { notaFinal: 6, posicao: 5, status: 'SUPLENTE' } }),
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
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 10, posicao: 1, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '3' }, data: { notaFinal: 8, posicao: 3, status: 'SUPLENTE' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '4' }, data: { notaFinal: 7, posicao: 4, status: 'NAO_CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '5' }, data: { notaFinal: 6, posicao: 5, status: 'NAO_CONTEMPLADA' } }),
    )
  })

  it('nota 0 → sempre NAO_CONTEMPLADA', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 0, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 0, posicao: 1, status: 'NAO_CONTEMPLADA' } }),
    )
  })

  it('totalAvaliacoes=0 → NAO_CONTEMPLADA', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 0, totalAvaliacoes: 0 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 0, posicao: 1, status: 'NAO_CONTEMPLADA' } }),
    )
  })

  it('notaMinima → nota abaixo do mínimo recebe NAO_CONTEMPLADA', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 5, totalAvaliacoes: 2 },
      { inscricaoId: '2', proponenteNome: 'Bob', categoria: null, notaFinal: 2, totalAvaliacoes: 2 },
      { inscricaoId: '3', proponenteNome: 'Carlos', categoria: null, notaFinal: 3, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL', { notaMinima: 3 })

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 5, posicao: 1, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '2' }, data: { notaFinal: 2, posicao: 2, status: 'NAO_CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '3' }, data: { notaFinal: 3, posicao: 3, status: 'CONTEMPLADA' } }),
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
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 8, posicao: 1, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '2' }, data: { notaFinal: 5, posicao: 2, status: 'CONTEMPLADA' } }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '3' }, data: { notaFinal: 2, posicao: 3, status: 'NAO_CONTEMPLADA' } }),
    )
  })

  it('sem notaMinima → comportamento anterior preservado', async () => {
    const resultados = [
      { inscricaoId: '1', proponenteNome: 'Ana', categoria: null, notaFinal: 2, totalAvaliacoes: 2 },
    ]

    await saveResults(resultados, 'RESULTADO_FINAL')

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' }, data: { notaFinal: 2, posicao: 1, status: 'CONTEMPLADA' } }),
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

  it('detecta empates — marca empatados corretamente', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: JSON.stringify([{ criterio: 'A', peso: 1, notaMax: 10 }]),
    } as never)

    mockPrisma.inscricao.findMany.mockResolvedValue([
      {
        id: '1',
        proponente: { nome: 'Ana' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 7 }]), notaTotal: 7 }],
      },
      {
        id: '2',
        proponente: { nome: 'Bob' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 7 }]), notaTotal: 7 }],
      },
    ] as never)

    const results = await calculateResults('edital-1')

    expect(results[0].notaFinal).toBe(7)
    expect(results[1].notaFinal).toBe(7)
    // Ambos devem ter empatados referenciando o outro
    expect(results[0].empatados).toContain(results[1].inscricaoId)
    expect(results[1].empatados).toContain(results[0].inscricaoId)
  })

  it('não marca empatados quando notas são diferentes', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: JSON.stringify([{ criterio: 'A', peso: 1, notaMax: 10 }]),
    } as never)

    mockPrisma.inscricao.findMany.mockResolvedValue([
      {
        id: '1',
        proponente: { nome: 'Ana' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 9 }]), notaTotal: 9 }],
      },
      {
        id: '2',
        proponente: { nome: 'Bob' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 7 }]), notaTotal: 7 }],
      },
    ] as never)

    const results = await calculateResults('edital-1')

    expect(results[0].empatados).toBeUndefined()
    expect(results[1].empatados).toBeUndefined()
  })

  it('detecta múltiplos grupos de empate', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: JSON.stringify([{ criterio: 'A', peso: 1, notaMax: 10 }]),
    } as never)

    mockPrisma.inscricao.findMany.mockResolvedValue([
      {
        id: '1',
        proponente: { nome: 'Ana' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 9 }]), notaTotal: 9 }],
      },
      {
        id: '2',
        proponente: { nome: 'Bob' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 9 }]), notaTotal: 9 }],
      },
      {
        id: '3',
        proponente: { nome: 'Carlos' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 5 }]), notaTotal: 5 }],
      },
      {
        id: '4',
        proponente: { nome: 'Diana' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 5 }]), notaTotal: 5 }],
      },
    ] as never)

    const results = await calculateResults('edital-1')

    // Grupo 1: Ana e Bob (nota 9)
    const grupo9 = results.filter(r => r.notaFinal === 9)
    expect(grupo9).toHaveLength(2)
    expect(grupo9[0].empatados).toHaveLength(1)

    // Grupo 2: Carlos e Diana (nota 5)
    const grupo5 = results.filter(r => r.notaFinal === 5)
    expect(grupo5).toHaveLength(2)
    expect(grupo5[0].empatados).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scoring discreto e cálculo por fórmula
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateExpression', () => {
  it('avalia soma simples', () => {
    expect(evaluateExpression('10+20', {})).toBe(30)
  })

  it('avalia subtração', () => {
    expect(evaluateExpression('50-20', {})).toBe(30)
  })

  it('avalia multiplicação e divisão', () => {
    expect(evaluateExpression('10*3/2', {})).toBe(15)
  })

  it('avalia parênteses', () => {
    expect(evaluateExpression('(10+20)/2', {})).toBe(15)
  })

  it('avalia com variáveis', () => {
    expect(evaluateExpression('(B1+B2)/2', { B1: 80, B2: 60 })).toBe(70)
  })

  it('avalia fórmula do ANEXO 01: ((B1+B2)/2)+B3', () => {
    expect(evaluateExpression('((B1+B2)/2)+B3', { B1: 80, B2: 70, B3: 5 })).toBe(80)
  })

  it('divisão por zero retorna 0', () => {
    expect(evaluateExpression('10/0', {})).toBe(0)
  })

  it('variável inexistente não quebra (vira 0)', () => {
    expect(evaluateExpression('B1+B99', { B1: 10 })).toBe(10)
  })

  it('lida com espaços na expressão', () => {
    expect(evaluateExpression('( B1 + B2 ) / 2', { B1: 40, B2: 60 })).toBe(50)
  })
})

describe('calculateBlockSum', () => {
  const criterios = [
    { criterio: 'A', peso: 10, notaMax: 10, bloco: 'Bloco 1', modo: 'discreto' as const },
    { criterio: 'B', peso: 3, notaMax: 3, bloco: 'Bloco 1', modo: 'discreto' as const },
    { criterio: 'C', peso: 5, notaMax: 5, bloco: 'Bloco 2', modo: 'discreto' as const },
  ]

  it('soma notas do bloco correto', () => {
    const notas = [
      { criterio: 'A', nota: 10 },
      { criterio: 'B', nota: 2 },
      { criterio: 'C', nota: 5 },
    ]
    expect(calculateBlockSum(notas, criterios, 'Bloco 1')).toBe(12) // 10 + 2
    expect(calculateBlockSum(notas, criterios, 'Bloco 2')).toBe(5)
  })

  it('bloco inexistente retorna 0', () => {
    const notas = [{ criterio: 'A', nota: 10 }]
    expect(calculateBlockSum(notas, criterios, 'Bloco 99')).toBe(0)
  })

  it('critério sem nota é ignorado (soma 0)', () => {
    const notas = [{ criterio: 'A', nota: 10 }] // B não tem nota
    expect(calculateBlockSum(notas, criterios, 'Bloco 1')).toBe(10)
  })
})

describe('calculateWithFormula', () => {
  it('calcula fórmula ((B1+B2)/2)+B3 com dados do ANEXO 01', () => {
    const criterios = [
      { criterio: 'Iniciativas', peso: 10, notaMax: 10, bloco: 'Bloco 1', modo: 'discreto' as const },
      { criterio: 'Autonomia', peso: 10, notaMax: 10, bloco: 'Bloco 1', modo: 'discreto' as const },
      { criterio: 'Cidadania', peso: 5, notaMax: 5, bloco: 'Bloco 2', modo: 'discreto' as const },
      { criterio: 'Formação', peso: 5, notaMax: 5, bloco: 'Bloco 2', modo: 'discreto' as const },
      { criterio: 'Bonificação', peso: 5, notaMax: 5, bloco: 'Bloco 3', modo: 'discreto' as const },
    ]

    const notas = [
      { criterio: 'Iniciativas', nota: 10 },  // Plenamente
      { criterio: 'Autonomia', nota: 5 },      // Parcial
      { criterio: 'Cidadania', nota: 5 },       // Plenamente
      { criterio: 'Formação', nota: 3 },        // Parcial
      { criterio: 'Bonificação', nota: 5 },     // Sim
    ]

    // B1 = 10 + 5 = 15, B2 = 5 + 3 = 8, B3 = 5
    // ((15 + 8) / 2) + 5 = 11.5 + 5 = 16.5
    const result = calculateWithFormula(notas, criterios, '((B1+B2)/2)+B3')
    expect(result).toBe(16.5)
  })

  it('fórmula sem bonificação: (B1+B2)/2', () => {
    const criterios = [
      { criterio: 'A', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
      { criterio: 'B', peso: 5, notaMax: 5, bloco: 'Bloco 2' },
    ]
    const notas = [
      { criterio: 'A', nota: 80 },
      { criterio: 'B', nota: 60 },
    ]

    expect(calculateWithFormula(notas, criterios, '(B1+B2)/2')).toBe(70)
  })

  it('retorna 0 quando não há notas', () => {
    const criterios = [
      { criterio: 'A', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
    ]
    expect(calculateWithFormula([], criterios, 'B1')).toBe(0)
  })
})

describe('calculateResults com formulaAvaliacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('usa fórmula quando edital tem formulaAvaliacao', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: JSON.stringify([
        { criterio: 'A', peso: 10, notaMax: 10, bloco: 'Bloco 1', modo: 'discreto' },
        { criterio: 'B', peso: 5, notaMax: 5, bloco: 'Bloco 2', modo: 'discreto' },
      ]),
      formulaAvaliacao: '(B1+B2)/2',
    } as never)

    mockPrisma.inscricao.findMany.mockResolvedValue([
      {
        id: '1',
        proponente: { nome: 'Ana' },
        categoria: null,
        avaliacoes: [{ notas: JSON.stringify([{ criterio: 'A', nota: 10 }, { criterio: 'B', nota: 4 }]), notaTotal: 7 }],
      },
    ] as never)

    const results = await calculateResults('edital-1')

    // B1 = 10, B2 = 4, (10+4)/2 = 7
    expect(results[0].notaFinal).toBe(7)
  })

  it('usa média ponderada quando não tem formulaAvaliacao', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: JSON.stringify([{ criterio: 'A', peso: 1, notaMax: 10 }]),
      formulaAvaliacao: null,
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
    expect(results[0].notaFinal).toBe(8)
  })
})

describe('saveManualOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.inscricao.update.mockResolvedValue({} as never)
    mockPrisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops))
  })

  it('atualiza posições dos IDs fornecidos', async () => {
    mockPrisma.inscricao.findMany.mockResolvedValue([
      { id: 'a', posicao: 1, notaFinal: 7 },
      { id: 'b', posicao: 2, notaFinal: 7 },
      { id: 'c', posicao: 3, notaFinal: 5 },
    ] as never)

    // Inverter ordem de a e b
    await saveManualOrder('edital-1', ['b', 'a'])

    // b deve receber posição 1, a deve receber posição 2
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'b' },
      data: { posicao: 1 },
    })
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'a' },
      data: { posicao: 2 },
    })
  })

  it('lança erro se ID não pertence ao edital', async () => {
    mockPrisma.inscricao.findMany.mockResolvedValue([
      { id: 'a', posicao: 1, notaFinal: 7 },
    ] as never)

    await expect(saveManualOrder('edital-1', ['inexistente']))
      .rejects.toThrow('não pertence ao edital')
  })
})
