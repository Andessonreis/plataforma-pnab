import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    edital: { findUnique: vi.fn() },
    inscricao: { findMany: vi.fn() },
    arquivoEdital: { findFirst: vi.fn() },
  },
}))

import { prisma } from '@/lib/db'
import { TEMPLATE_RESULTADO_PADRAO } from '@/lib/edital/template-resultado'
import { consultarResultado } from '../consulta'

const ATUAL = {
  numero: 'PNAB-2026-0139', posicao: 1, categoria: 'Arte Visual/Exposição', notaFinal: 98, status: 'CONTEMPLADA',
  proponente: { nome: 'Kel Dourado' },
}

const COPIA = {
  publicadoEm: '2026-09-22T17:16:50.000Z',
  linhas: [{
    numero: 'PNAB-2026-0139', posicao: 4, proponente: 'KEL DOURADO', categoria: 'Arte Visual/Exposição',
    nota: '92.33', situacao: 'SUPLENTE',
  }],
}

function edital(status: string, resultadoPreliminar: unknown = null, resultadoTemplate: unknown = null) {
  vi.mocked(prisma.edital.findUnique).mockResolvedValue({
    id: 'ed-1', titulo: 'Festival', ano: 2026, status, formulaAvaliacao: null,
    cronograma: [], categoriasConfig: null, resultadoPreliminar, resultadoTemplate,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.inscricao.findMany).mockResolvedValue([ATUAL] as never)
  vi.mocked(prisma.arquivoEdital.findFirst).mockResolvedValue(null as never)
})

describe('consultarResultado — preliminar', () => {
  it('lê a cópia guardada mesmo depois de o resultado final sair', async () => {
    edital('RESULTADO_FINAL', COPIA)
    const dados = await consultarResultado('festival', 'preliminar')

    expect(dados?.disponivel).toBe(true)
    expect(dados?.categorias[0].linhas[0]).toMatchObject({ posicao: 4, nota: '92.33', situacao: 'SUPLENTE' })
    expect(dados?.definitivoPublicado).toBe(true)
    expect(dados?.publicadoEm).toEqual(new Date('2026-09-22T17:16:50.000Z'))
    expect(prisma.inscricao.findMany).not.toHaveBeenCalled()
  })

  it('não expõe a cópia quando o edital voltou a uma fase anterior à publicação', async () => {
    edital('AVALIACAO', COPIA)
    const dados = await consultarResultado('festival', 'preliminar')

    expect(dados?.disponivel).toBe(false)
  })

  it('sem cópia, usa a lista atual enquanto o edital ainda está na fase do preliminar', async () => {
    edital('RESULTADO_PRELIMINAR')
    const dados = await consultarResultado('festival', 'preliminar')

    expect(dados?.disponivel).toBe(true)
    expect(dados?.categorias[0].linhas[0].posicao).toBe(1)
    expect(dados?.publicadoEm).toBeNull()
  })

  it('sem cópia e com o edital já no final, o preliminar não está disponível', async () => {
    edital('ENCERRADO')
    const dados = await consultarResultado('festival', 'preliminar')

    expect(dados?.disponivel).toBe(false)
    expect(dados?.categorias).toEqual([])
  })
})

describe('consultarResultado — definitivo', () => {
  it('só fica disponível quando o edital chegou ao resultado final', async () => {
    edital('RECURSO', COPIA)
    expect((await consultarResultado('festival', 'definitivo'))?.disponivel).toBe(false)

    edital('RESULTADO_FINAL', COPIA)
    expect((await consultarResultado('festival', 'definitivo'))?.disponivel).toBe(true)
  })

  it('lê as inscrições como estão, não a cópia do preliminar', async () => {
    edital('RESULTADO_FINAL', COPIA)
    const dados = await consultarResultado('festival', 'definitivo')

    expect(dados?.categorias[0].linhas[0]).toMatchObject({ posicao: 1, nota: '98.00', situacao: 'CONTEMPLADA' })
  })

  it('não usa o arquivo do edital como Diário Oficial do resultado final', async () => {
    edital('RESULTADO_FINAL')
    vi.mocked(prisma.arquivoEdital.findFirst).mockResolvedValue({ url: 'https://gateway/Ed 2935.pdf' } as never)

    expect((await consultarResultado('festival', 'definitivo'))?.diarioOficialUrl).toBeNull()
    expect((await consultarResultado('festival', 'preliminar'))?.diarioOficialUrl).toBe('https://gateway/Ed 2935.pdf')
  })
})

it('devolve null para edital inexistente', async () => {
  vi.mocked(prisma.edital.findUnique).mockResolvedValue(null as never)
  expect(await consultarResultado('nao-existe', 'preliminar')).toBeNull()
})

describe('consultarResultado — template do edital', () => {
  it('edital sem template usa o padrão', async () => {
    edital('RESULTADO_PRELIMINAR')
    const dados = await consultarResultado('festival', 'preliminar')

    expect(dados?.template).toEqual(TEMPLATE_RESULTADO_PADRAO)
  })

  it('devolve o template configurado, com o que faltar no padrão', async () => {
    edital('RESULTADO_PRELIMINAR', null, { titulos: { preliminar: 'Classificação preliminar' } })
    const dados = await consultarResultado('festival', 'preliminar')

    expect(dados?.template.titulos).toEqual({ preliminar: 'Classificação preliminar', definitivo: 'Resultado final' })
  })

  it('o resultado final tira da lista quem o template deixa fora da classificação', async () => {
    edital('RESULTADO_FINAL', null, { foraDaClassificacao: ['PNAB-2026-0046'] })
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([
      ATUAL,
      { ...ATUAL, numero: 'PNAB-2026-0046', posicao: 2, notaFinal: 67.17 },
    ] as never)
    const dados = await consultarResultado('festival', 'definitivo')

    expect(dados?.categorias[0].linhas).toEqual([
      expect.objectContaining({ numero: 'PNAB-2026-0139', posicao: 1 }),
      expect.objectContaining({ numero: 'PNAB-2026-0046', posicao: null, nota: null }),
    ])
  })

  it('sem a lista no template a mesma inscrição sai classificada', async () => {
    edital('RESULTADO_FINAL')
    vi.mocked(prisma.inscricao.findMany).mockResolvedValue([
      { ...ATUAL, numero: 'PNAB-2026-0046', posicao: 2, notaFinal: 67.17 },
    ] as never)
    const dados = await consultarResultado('festival', 'definitivo')

    expect(dados?.categorias[0].linhas[0]).toMatchObject({ posicao: 2, nota: '67.17' })
  })
})
