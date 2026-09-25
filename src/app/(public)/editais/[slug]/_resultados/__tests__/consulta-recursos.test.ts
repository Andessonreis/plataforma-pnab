import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    edital: { findUnique: vi.fn() },
    recurso: { findMany: vi.fn() },
    inscricao: { count: vi.fn() },
    arquivoEdital: { findFirst: vi.fn() },
  },
}))

import { prisma } from '@/lib/db'
import { TEMPLATE_RESULTADO_PADRAO } from '@/lib/edital/template-resultado'
import { consultarResultadoRecursos } from '../consulta-recursos'

const DIARIO = 'https://gateway/Ed 2938.pdf'

const CRONOGRAMA = [
  { tipo: 'custom', label: 'Período para recursos — seleção', dataHora: '2026-09-23T00:00:00', fimEm: '2026-09-24T23:59:00', acao: 'RECURSO_RESULTADO_FINAL_JANELA' },
  { tipo: 'custom', label: 'Resultado Final', dataHora: '2026-09-25T00:00:00', acao: 'PUBLICACAO_RESULTADO_FINAL', diarioOficialUrl: DIARIO },
]

function recurso(numero: string, nome: string, cpfCnpj: string | null, decisao: string | null) {
  return { createdAt: new Date('2026-09-23T12:00:00Z'), decisao, inscricao: { numero, proponente: { nome, cpfCnpj } } }
}

function edital(status: string, extra: Record<string, unknown> = {}) {
  vi.mocked(prisma.edital.findUnique).mockResolvedValue({
    id: 'ed-1', titulo: 'Festival', ano: 2026, status, cronograma: CRONOGRAMA, resultadoTemplate: null, ...extra,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.recurso.findMany).mockResolvedValue([
    recurso('PNAB-2026-0139', 'Cleriston Kerley Dourado', '00326220585', 'DEFERIDO'),
    recurso('PNAB-2026-0109', 'ESCOLA DE MUSICA IRECE LTDA', '55712345000100', 'INDEFERIDO'),
  ] as never)
  vi.mocked(prisma.inscricao.count).mockResolvedValue(111 as never)
  vi.mocked(prisma.arquivoEdital.findFirst).mockResolvedValue({ url: 'https://storage/relatorio.pdf' } as never)
})

describe('consultarResultadoRecursos', () => {
  it('edital inexistente devolve null', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValue(null)

    expect(await consultarResultadoRecursos('nao-existe')).toBeNull()
  })

  it.each(['PUBLICADO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO'])(
    'com o edital em %s a decisão dos recursos não é exposta nem consultada',
    async (status) => {
      edital(status)
      const dados = await consultarResultadoRecursos('festival')

      expect(dados).toMatchObject({ disponivel: false, recursos: [], relatorioUrl: null, diarioOficialUrl: null })
      expect(prisma.recurso.findMany).not.toHaveBeenCalled()
    },
  )

  it.each(['RESULTADO_FINAL', 'ENCERRADO'])('com o edital em %s lista os recursos na ordem do protocolo', async (status) => {
    edital(status)
    const dados = await consultarResultadoRecursos('festival')

    expect(dados?.disponivel).toBe(true)
    expect(dados?.recursos.map((r) => [r.posicao, r.numero, r.decisao, r.situacao])).toEqual([
      [1, 'PNAB-2026-0139', 'DEFERIDO', 'Deferido'],
      [2, 'PNAB-2026-0109', 'INDEFERIDO', 'Indeferido'],
    ])
    expect(dados?.totalInscricoes).toBe(111)
    expect(dados?.rotuloDoUniverso).toBe('Inscrições classificadas')
  })

  it('mascara o CPF/CNPJ como as relações publicadas no Diário Oficial', async () => {
    edital('RESULTADO_FINAL')
    const dados = await consultarResultadoRecursos('festival')

    expect(dados?.recursos.map((r) => r.cpfCnpj)).toEqual(['003.***.***-85', '557.***.***-00'])
  })

  it('recurso sem decisão aparece como "Em análise" e CPF ausente vira travessão', async () => {
    edital('RESULTADO_FINAL')
    vi.mocked(prisma.recurso.findMany).mockResolvedValue([recurso('PNAB-2026-0007', 'Fulano', null, null)] as never)
    const dados = await consultarResultadoRecursos('festival')

    expect(dados?.recursos[0]).toMatchObject({ decisao: null, situacao: 'Em análise', cpfCnpj: '—' })
  })

  it('traz o prazo da janela de recursos e o Diário Oficial do resultado final', async () => {
    edital('RESULTADO_FINAL')
    const dados = await consultarResultadoRecursos('festival')

    expect(dados?.prazo?.inicio.toISOString()).toBe('2026-09-23T03:00:00.000Z')
    expect(dados?.prazo?.fim.toISOString()).toBe('2026-09-25T02:59:00.000Z')
    expect(dados?.diarioOficialUrl).toBe(DIARIO)
    expect(dados?.relatorioUrl).toBe('https://storage/relatorio.pdf')
  })

  it('sem janela cadastrada o prazo fica vazio, sem derrubar a página', async () => {
    edital('RESULTADO_FINAL', { cronograma: [] })
    const dados = await consultarResultadoRecursos('festival')

    expect(dados?.prazo).toBeNull()
    expect(dados?.recursos).toHaveLength(2)
  })

  it('a capa usa as fotos do template do edital, ou o padrão', async () => {
    edital('RESULTADO_FINAL')
    expect((await consultarResultadoRecursos('festival'))?.fotos).toEqual(TEMPLATE_RESULTADO_PADRAO.fotos)

    edital('RESULTADO_FINAL', { resultadoTemplate: { fotos: ['/images/outra.jpg'] } })
    expect((await consultarResultadoRecursos('festival'))?.fotos).toEqual(['/images/outra.jpg'])
  })

  it('busca os recursos da fase que o cronograma cadastra, do edital certo', async () => {
    edital('RESULTADO_FINAL')
    await consultarResultadoRecursos('festival')

    expect(prisma.recurso.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { fase: 'RESULTADO_FINAL', inscricao: { editalId: 'ed-1' } },
    }))
  })

  it('marco pontual da mesma ação, mais recente, não esconde o prazo da janela', async () => {
    edital('RESULTADO_FINAL', {
      cronograma: [
        ...CRONOGRAMA,
        { tipo: 'custom', label: 'Aviso', dataHora: '2026-09-26T00:00:00', acao: 'RECURSO_RESULTADO_FINAL_JANELA' },
      ],
    })
    const dados = await consultarResultadoRecursos('festival')

    expect(dados?.prazo?.fim.toISOString()).toBe('2026-09-25T02:59:00.000Z')
  })

  it.each(['Relatório de Recursos Interpostos - Seleção', 'relatorio de recursos interpostos — selecao (Diário Oficial)'])(
    'a busca do relatório não depende do travessão nem da capitalização do título (%s)',
    async () => {
      edital('RESULTADO_FINAL')
      await consultarResultadoRecursos('festival')

      const { where } = vi.mocked(prisma.arquivoEdital.findFirst).mock.calls[0][0] as { where: { AND: { titulo: { contains: string; mode: string } }[] } }
      expect(where.AND.map((c) => c.titulo.contains)).toEqual(['Recursos Interpostos', 'Seleção'])
      expect(where.AND.every((c) => c.titulo.mode === 'insensitive')).toBe(true)
    },
  )
})
