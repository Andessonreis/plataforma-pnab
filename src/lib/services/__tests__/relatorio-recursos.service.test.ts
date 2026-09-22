import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitirRelatorioRecursos } from '../relatorio-recursos.service'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { descartarEmissao, registrarEmissao } from '@/lib/documentos/emissao'
import { generateRelatorioRecursos } from '@/lib/pdf/relatorio-recursos'
import { PUBLICACAO_STATUS_FILTER } from '@/lib/edital/publicacoes'
import { EMISSAO, entrada, prepararCenarioPadrao, recursoDoBanco } from './relatorio-recursos.fixtures'

vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn(), descartarEmissao: vi.fn() }))
vi.mock('@/lib/pdf/relatorio-recursos', () => ({ generateRelatorioRecursos: vi.fn() }))

const mockPrisma = vi.mocked(prisma)
const mockRegistrarEmissao = vi.mocked(registrarEmissao)
const mockDescartarEmissao = vi.mocked(descartarEmissao)
const mockGerarPdf = vi.mocked(generateRelatorioRecursos)
const mockLogAudit = vi.mocked(logAudit)

describe('emitirRelatorioRecursos', () => {
  beforeEach(prepararCenarioPadrao)
  afterEach(() => vi.useRealTimers())

  it('sem recurso: emite o extrato com lista vazia e o universo da habilitação', async () => {
    const resultado = await emitirRelatorioRecursos(entrada)

    expect(mockGerarPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        etapa: 'Habilitação',
        totalInscricoes: 15,
        labelTotalInscricoes: 'Inscrições analisadas',
        recursos: [],
        foraDoPrazo: 0,
        emissao: EMISSAO,
        prazo: {
          inicio: new Date('2026-09-16T00:00:00-03:00'),
          fim: new Date('2026-09-18T23:59:00-03:00'),
        },
      }),
    )
    expect(mockPrisma.inscricao.count).toHaveBeenCalledWith({
      where: { editalId: 'ed-1', status: { in: PUBLICACAO_STATUS_FILTER.PUBLICACAO_HABILITADOS } },
    })
    expect(resultado.buffer.toString()).toBe('%PDF-fake')
    expect(resultado.emissao).toEqual(EMISSAO)
    expect(resultado.filename).toBe('relatorio_recursos_habilitacao_premiacao-mestres_2026-09-21.pdf')
    expect(mockDescartarEmissao).not.toHaveBeenCalled()
  })

  it('com recursos: numera em ordem de protocolo, desempata pelo id e traduz a decisão', async () => {
    mockPrisma.recurso.findMany.mockResolvedValue([
      recursoDoBanco('PNAB-2026-0043', '2026-09-16T10:00:00-03:00', 'DEFERIDO'),
      recursoDoBanco('PNAB-2026-0047', '2026-09-17T10:00:00-03:00', 'INDEFERIDO', null),
      recursoDoBanco('PNAB-2026-0100', '2026-09-18T10:00:00-03:00', null, '98765432100'),
      recursoDoBanco('PNAB-2026-0101', '2026-09-18T11:00:00-03:00', 'DEFERIDO_PARCIAL'),
    ] as never)

    await emitirRelatorioRecursos(entrada)

    expect(mockPrisma.recurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fase: 'HABILITACAO', inscricao: { editalId: 'ed-1' } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    )
    const { recursos } = mockGerarPdf.mock.calls[0][0]
    expect(recursos.map((r) => [r.posicao, r.numero, r.situacao, r.cpfCnpj])).toEqual([
      [1, 'PNAB-2026-0043', 'Deferido', '12345678901'],
      [2, 'PNAB-2026-0047', 'Indeferido', ''],
      [3, 'PNAB-2026-0100', 'Em análise', '98765432100'],
      [4, 'PNAB-2026-0101', 'DEFERIDO_PARCIAL', '12345678901'],
    ])
  })

  it('etapa de seleção: usa a fase do resultado preliminar e o universo classificado', async () => {
    vi.setSystemTime(new Date('2026-10-05T12:00:00-03:00'))

    await emitirRelatorioRecursos({ ...entrada, etapa: 'selecao' })

    expect(mockPrisma.recurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fase: 'RESULTADO_PRELIMINAR', inscricao: { editalId: 'ed-1' } } }),
    )
    expect(mockPrisma.inscricao.count).toHaveBeenCalledWith({
      where: { editalId: 'ed-1', status: { in: PUBLICACAO_STATUS_FILTER.PUBLICACAO_RESULTADO_PRELIMINAR } },
    })
    expect(mockGerarPdf).toHaveBeenCalledWith(
      expect.objectContaining({ etapa: 'Seleção', labelTotalInscricoes: 'Inscrições classificadas' }),
    )
  })

  it('registra a emissão com conteúdo para o hash e metadados sem dado pessoal', async () => {
    mockPrisma.recurso.findMany.mockResolvedValue([
      recursoDoBanco('PNAB-2026-0043', '2026-09-16T10:00:00-03:00', 'DEFERIDO'),
    ] as never)

    await emitirRelatorioRecursos(entrada)

    const chamada = mockRegistrarEmissao.mock.calls[0][0]
    expect(chamada).toMatchObject({
      tipo: 'RELATORIO_RECURSOS',
      titulo: 'Relatório de recursos — Habilitação — Premiação para Mestres e Mestras de Irecê (2026)',
      editalId: 'ed-1',
      emitidoPorId: 'admin-1',
      metadados: {
        Etapa: 'Habilitação',
        'Prazo para interposição': '16/09/2026 a 18/09/2026',
        'Inscrições analisadas': 15,
        'Recursos interpostos': 1,
      },
    })
    expect(chamada.conteudo).toMatchObject({
      etapa: 'habilitacao',
      totalInscricoes: 15,
      recursos: [{ numero: 'PNAB-2026-0043', protocoladoEm: '2026-09-16T13:00:00.000Z', situacao: 'Deferido' }],
    })
    expect(JSON.stringify(chamada.metadados)).not.toMatch(/Maria|12345678901/)
  })

  it('audita a emissão com o código que liga a trilha ao documento', async () => {
    await emitirRelatorioRecursos(entrada)

    expect(mockLogAudit).toHaveBeenCalledWith({
      userId: 'admin-1',
      action: 'EXPORTACAO_RELATORIO_RECURSOS',
      entity: 'Edital',
      entityId: 'ed-1',
      details: {
        slug: 'premiacao-mestres',
        etapa: 'habilitacao',
        recursos: 0,
        totalInscricoes: 15,
        foraDoPrazo: 0,
        codigoEmissao: 'PNAB-ABCD-2345',
        hashConteudo: 'hash-do-conteudo',
      },
      ip: '10.0.0.1',
    })
  })

  it('emissão não registrada: o PDF sai mesmo assim e a auditoria guarda código nulo', async () => {
    mockRegistrarEmissao.mockResolvedValue(null)

    const resultado = await emitirRelatorioRecursos(entrada)

    expect(resultado.emissao).toBeNull()
    expect(mockGerarPdf).toHaveBeenCalledWith(expect.objectContaining({ emissao: null }))
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ details: expect.objectContaining({ codigoEmissao: null, hashConteudo: null }) }),
    )
  })

  describe('falha ao gerar o PDF', () => {
    it('descarta a emissão já registrada, propaga o erro e não audita', async () => {
      mockGerarPdf.mockRejectedValue(new Error('pdfkit quebrou'))

      await expect(emitirRelatorioRecursos(entrada)).rejects.toThrow('pdfkit quebrou')

      expect(mockDescartarEmissao).toHaveBeenCalledWith('PNAB-ABCD-2345')
      expect(mockLogAudit).not.toHaveBeenCalled()
    })

    it('sem emissão registrada não há o que descartar', async () => {
      mockRegistrarEmissao.mockResolvedValue(null)
      mockGerarPdf.mockRejectedValue(new Error('pdfkit quebrou'))

      await expect(emitirRelatorioRecursos(entrada)).rejects.toThrow('pdfkit quebrou')

      expect(mockDescartarEmissao).not.toHaveBeenCalled()
    })
  })
})
