import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { guardarResultadoPreliminar, lerResultadoPreliminar, linhasDoResultado } from '../resultado-publico'

const INSCRICAO = {
  numero: 'PNAB-2026-0139',
  posicao: 1,
  categoria: 'Arte Visual/Exposição',
  notaFinal: 98,
  status: 'CONTEMPLADA',
  proponente: { nome: 'Kel Dourado' },
}

beforeEach(() => vi.clearAllMocks())

describe('linhasDoResultado', () => {
  it('monta a linha pública: nome em caixa alta e nota com duas casas', async () => {
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([INSCRICAO] as never)
    expect(await linhasDoResultado('ed-1', [])).toEqual([{
      numero: 'PNAB-2026-0139', posicao: 1, proponente: 'KEL DOURADO',
      categoria: 'Arte Visual/Exposição', nota: '98.00', situacao: 'CONTEMPLADA',
    }])
  })

  it('mantém sem nota e sem posição quem ficou fora da classificação', async () => {
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([{ ...INSCRICAO, notaFinal: null, posicao: null, status: 'NAO_CONTEMPLADA' }] as never)
    const [linha] = await linhasDoResultado('ed-1', [])
    expect(linha.nota).toBeNull()
    expect(linha.posicao).toBeNull()
  })

  it('pede a lista por categoria, depois posição, depois nota', async () => {
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([] as never)
    await linhasDoResultado('ed-1', [])
    const { orderBy } = vi.mocked(prisma.inscricao.findMany).mock.calls[0][0] as { orderBy: unknown[] }
    expect(orderBy).toEqual([
      { categoria: 'asc' },
      { posicao: { sort: 'asc', nulls: 'last' } },
      { notaFinal: { sort: 'desc', nulls: 'last' } },
    ])
  })

  it('a inscrição da lista de exceções sai sem posição nem nota, mesmo que o cálculo tenha lhe dado uma', async () => {
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([
      { ...INSCRICAO, numero: 'PNAB-2026-0046', posicao: 1, notaFinal: 67.17, status: 'CONTEMPLADA' },
    ] as never)
    const [linha] = await linhasDoResultado('ed-1', ['PNAB-2026-0046'])
    expect(linha).toMatchObject({ posicao: null, nota: null })
  })

  it('sem lista de exceções, a mesma inscrição sai classificada', async () => {
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([
      { ...INSCRICAO, numero: 'PNAB-2026-0046', posicao: 1, notaFinal: 67.17, status: 'CONTEMPLADA' },
    ] as never)
    const [linha] = await linhasDoResultado('ed-1', [])
    expect(linha).toMatchObject({ posicao: 1, nota: '67.17' })
  })
})

describe('guardarResultadoPreliminar', () => {
  it('a cópia guardada respeita a lista de exceções do template do edital', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValue({
      resultadoTemplate: { foraDaClassificacao: ['PNAB-2026-0046'] },
    } as never)
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([
      { ...INSCRICAO, numero: 'PNAB-2026-0046', posicao: 1, notaFinal: 67.17, status: 'CONTEMPLADA' },
    ] as never)

    await guardarResultadoPreliminar('ed-1', new Date('2026-09-22T17:16:50Z'))

    const { data } = vi.mocked(prisma.edital.update).mock.calls[0][0] as { data: { resultadoPreliminar: { linhas: unknown[] } } }
    expect(data.resultadoPreliminar.linhas).toEqual([expect.objectContaining({ numero: 'PNAB-2026-0046', posicao: null, nota: null })])
  })

  it('grava no edital a data de publicação e a lista daquele momento', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValue(null as never)
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([INSCRICAO] as never)
    await guardarResultadoPreliminar('ed-1', new Date('2026-09-22T17:16:50Z'))

    expect(prisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: { resultadoPreliminar: { publicadoEm: '2026-09-22T17:16:50.000Z', linhas: expect.any(Array) } },
    })
  })
})

describe('lerResultadoPreliminar', () => {
  it('devolve a cópia guardada', () => {
    const guardado = { publicadoEm: '2026-09-22T17:16:50.000Z', linhas: [] }
    expect(lerResultadoPreliminar(guardado)).toEqual(guardado)
  })

  it.each([null, undefined, 'texto', 3, {}, { publicadoEm: 3, linhas: [] }, { publicadoEm: 'x', linhas: 'y' }])(
    'ignora valor que não tem a forma esperada (%j)',
    (bruto) => {
      expect(lerResultadoPreliminar(bruto)).toBeNull()
    },
  )
})
