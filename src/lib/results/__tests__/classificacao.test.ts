import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CategoriaConfig } from '@/types/categoria-config'

const calculateResults = vi.fn()
const findMany = vi.fn()

vi.mock('@/lib/db', () => ({ prisma: { inscricao: { findMany: (...a: unknown[]) => findMany(...a) } } }))
vi.mock('../calculate', () => ({ calculateResults: (...a: unknown[]) => calculateResults(...a) }))

const { montarClassificacao } = await import('../classificacao')

const categoriasConfig: CategoriaConfig[] = [
  {
    nome: 'Música',
    vagasAmplaConcorrencia: 1,
    cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }],
    valorPorProjeto: 5000,
    valorTotalCategoria: 10000,
  },
]

function resultado(over: Record<string, unknown>) {
  return {
    inscricaoId: 'i1', numero: 'PNAB-0001', proponenteNome: 'Ana', categoria: 'Música',
    cotasOptIn: [], bonusItens: [], notaFinal: 80, notaBonus: 0, totalAvaliacoes: 3,
    ...over,
  }
}

beforeEach(() => {
  calculateResults.mockReset()
  findMany.mockReset()
  findMany.mockResolvedValue([])
})

describe('montarClassificacao', () => {
  it('sem inscrições devolve lista vazia sem consultar o banco', async () => {
    calculateResults.mockResolvedValue([])
    expect(await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })).toEqual([])
    expect(findMany).not.toHaveBeenCalled()
  })

  it('separa notaBase de notaBonus quando o bônus está incluído', async () => {
    calculateResults.mockResolvedValue([resultado({ notaFinal: 95, notaBonus: 10 })])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    expect(cat.linhas[0]).toMatchObject({ notaBase: 85, notaBonus: 10, notaFinal: 95 })
  })

  it('sem bônus incluído, notaBase é a própria nota final', async () => {
    calculateResults.mockResolvedValue([resultado({ notaFinal: 85, notaBonus: 10 })])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: false, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    expect(cat.linhas[0]).toMatchObject({ notaBase: 85, notaBonus: 0, notaFinal: 85 })
  })

  it('leva os itens de bonificação de cada inscrição quando o bônus está incluído', async () => {
    calculateResults.mockResolvedValue([
      resultado({ inscricaoId: 'a', notaFinal: 95, notaBonus: 10, bonusItens: ['pcd', 'etnico_racial'] }),
      resultado({ inscricaoId: 'b', notaFinal: 80, bonusItens: undefined }),
    ])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    expect(cat.linhas.map((l) => l.bonusItens)).toEqual([['pcd', 'etnico_racial'], []])
  })

  it('sem bônus incluído, nenhum item de bonificação sai na linha', async () => {
    calculateResults.mockResolvedValue([resultado({ notaFinal: 85, bonusItens: ['pcd'] })])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: false, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    expect(cat.linhas[0].bonusItens).toEqual([])
  })

  it('aplica a nota mínima do edital', async () => {
    calculateResults.mockResolvedValue([
      resultado({ inscricaoId: 'ok', notaFinal: 40 }),
      resultado({ inscricaoId: 'baixa', notaFinal: 39.99 }),
    ])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    expect(cat.linhas.find((l) => l.inscricaoId === 'ok')?.status).toBe('CONTEMPLADA')
    expect(cat.linhas.find((l) => l.inscricaoId === 'baixa')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('cota vai para o melhor optante ainda não alocado, mesmo com nota menor', async () => {
    calculateResults.mockResolvedValue([
      resultado({ inscricaoId: 'topo', notaFinal: 90 }),
      resultado({ inscricaoId: 'meio', notaFinal: 80 }),
      resultado({ inscricaoId: 'cotista', notaFinal: 70, cotasOptIn: ['negros'] }),
    ])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    const porId = new Map(cat.linhas.map((l) => [l.inscricaoId, l]))
    expect(porId.get('topo')?.status).toBe('CONTEMPLADA')
    expect(porId.get('cotista')?.status).toBe('CONTEMPLADA')
    expect(porId.get('cotista')?.cotista).toBe(true)
    expect(porId.get('meio')?.status).toBe('SUPLENTE')
  })

  it('cota sem optante é remanejada para a ampla concorrência', async () => {
    calculateResults.mockResolvedValue([
      resultado({ inscricaoId: 'a', notaFinal: 90 }),
      resultado({ inscricaoId: 'b', notaFinal: 80 }),
    ])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    expect(cat.linhas.map((l) => l.status)).toEqual(['CONTEMPLADA', 'CONTEMPLADA'])
  })

  it('agrupa por categoria em ordem alfabética e carrega vagas e valor da config', async () => {
    calculateResults.mockResolvedValue([
      resultado({ inscricaoId: 'z', categoria: 'Teatro', notaFinal: 90 }),
      resultado({ inscricaoId: 'a', categoria: 'Música', notaFinal: 70 }),
    ])
    const cats = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: null, maxSuplentes: null, categoriasConfig,
    })
    expect(cats.map((c) => c.nome)).toEqual(['Música', 'Teatro'])
    expect(cats[0]).toMatchObject({ vagasAmplaConcorrencia: 1, valorPorProjeto: 5000 })
    // Categoria fora da config não tem vaga discreta e não quebra
    expect(cats[1]).toMatchObject({ vagasAmplaConcorrencia: null, valorPorProjeto: null })
  })

  it('marca quem não tem avaliação finalizada', async () => {
    calculateResults.mockResolvedValue([resultado({ notaFinal: 0, totalAvaliacoes: 0 })])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    expect(cat.linhas[0]).toMatchObject({ semAvaliacao: true, status: 'NAO_CONTEMPLADA' })
  })

  it('usa numero e contagem de avaliadores vindos do banco', async () => {
    calculateResults.mockResolvedValue([resultado({ inscricaoId: 'i1', numero: undefined })])
    findMany.mockResolvedValue([{ id: 'i1', numero: 'PNAB-2026-0042', _count: { avaliacoes: 3 } }])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: null, categoriasConfig,
    })
    expect(cat.linhas[0]).toMatchObject({ numero: 'PNAB-2026-0042', atribuidos: 3 })
  })

  it('respeita o teto de suplentes', async () => {
    calculateResults.mockResolvedValue([
      resultado({ inscricaoId: 'a', notaFinal: 90 }),
      resultado({ inscricaoId: 'b', notaFinal: 80 }),
      resultado({ inscricaoId: 'c', notaFinal: 70 }),
      resultado({ inscricaoId: 'd', notaFinal: 60 }),
    ])
    const [cat] = await montarClassificacao('e1', {
      incluirBonus: true, notaMinima: 40, maxSuplentes: 1, categoriasConfig,
    })
    expect(cat.linhas.map((l) => l.status)).toEqual([
      'CONTEMPLADA', 'CONTEMPLADA', 'SUPLENTE', 'NAO_CONTEMPLADA',
    ])
  })
})
