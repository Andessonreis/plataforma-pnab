import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitirRelatorioRecursos } from '../relatorio-recursos.service'
import { prisma } from '@/lib/db'
import { generateRelatorioRecursos } from '@/lib/pdf/relatorio-recursos'
import {
  JANELA_HABILITACAO, JANELA_SELECAO, JANELA_SELECAO_FINAL, edital, entrada, prepararCenarioPadrao, recursoDoBanco,
} from './relatorio-recursos.fixtures'

vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn(), descartarEmissao: vi.fn() }))
vi.mock('@/lib/pdf/relatorio-recursos', () => ({ generateRelatorioRecursos: vi.fn() }))
vi.mock('@/lib/pdf/template-1/relatorio-recursos', () => ({ gerarRelatorioRecursosV1: vi.fn() }))
vi.mock('@/lib/documentos/preferencia', () => ({ templatePreferido: vi.fn() }))

const mockPrisma = vi.mocked(prisma)
const mockGerarPdf = vi.mocked(generateRelatorioRecursos)

const selecao = { ...entrada, etapa: 'selecao' as const }

// Janela do resultado preliminar: 29/09 a 30/09. Janela do resultado final: 08/10 a 09/10.
describe('extrato da seleção — fase do recurso conforme o cronograma', () => {
  beforeEach(() => {
    prepararCenarioPadrao()
    vi.setSystemTime(new Date('2026-10-12T12:00:00-03:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('Festival: só a janela do resultado final cadastrada → recursos da fase RESULTADO_FINAL e o prazo dela', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(edital([JANELA_HABILITACAO, JANELA_SELECAO_FINAL]) as never)
    mockPrisma.recurso.findMany.mockResolvedValue([
      recursoDoBanco('PNAB-2026-0007', '2026-10-08T10:00:00-03:00', 'DEFERIDO'),
    ] as never)

    await emitirRelatorioRecursos(selecao)

    expect(mockPrisma.recurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fase: 'RESULTADO_FINAL', inscricao: { editalId: 'ed-1' } } }),
    )
    expect(mockGerarPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        etapa: 'Seleção',
        foraDoPrazo: 0,
        prazo: {
          inicio: new Date('2026-10-08T00:00:00-03:00'),
          fim: new Date('2026-10-09T23:59:00-03:00'),
        },
      }),
    )
  })

  it('Festival: recurso protocolado fora da janela do resultado final é marcado', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(edital([JANELA_SELECAO_FINAL]) as never)
    mockPrisma.recurso.findMany.mockResolvedValue([
      recursoDoBanco('PNAB-2026-0007', '2026-10-10T08:00:00-03:00', null),
    ] as never)

    await emitirRelatorioRecursos(selecao)

    const dados = mockGerarPdf.mock.calls[0][0]
    expect(dados.recursos.map((r) => r.situacao)).toEqual(['Em análise (fora do prazo)'])
    expect(dados.foraDoPrazo).toBe(1)
  })

  it('Festival: janela do resultado final ainda em curso → LOCKED', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(edital([JANELA_SELECAO_FINAL]) as never)
    vi.setSystemTime(new Date('2026-10-09T12:00:00-03:00'))

    await expect(emitirRelatorioRecursos(selecao)).rejects.toMatchObject({
      code: 'LOCKED',
      message: expect.stringMatching(/ainda não terminou \(08\/10\/2026 a 09\/10\/2026\)/),
    })
    expect(mockPrisma.recurso.findMany).not.toHaveBeenCalled()
  })

  it('só a janela do resultado preliminar cadastrada → continua na fase RESULTADO_PRELIMINAR', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(edital([JANELA_HABILITACAO, JANELA_SELECAO]) as never)

    await emitirRelatorioRecursos(selecao)

    expect(mockPrisma.recurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fase: 'RESULTADO_PRELIMINAR', inscricao: { editalId: 'ed-1' } } }),
    )
    expect(mockGerarPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        prazo: {
          inicio: new Date('2026-09-29T00:00:00-03:00'),
          fim: new Date('2026-09-30T23:59:00-03:00'),
        },
      }),
    )
  })

  it('as duas janelas cadastradas → o resultado preliminar tem precedência', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(
      edital([JANELA_SELECAO_FINAL, JANELA_SELECAO]) as never,
    )

    await emitirRelatorioRecursos(selecao)

    expect(mockPrisma.recurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fase: 'RESULTADO_PRELIMINAR', inscricao: { editalId: 'ed-1' } } }),
    )
  })

  it('nenhuma das duas janelas cadastrada → LOCKED, como antes', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(edital([JANELA_HABILITACAO]) as never)

    await expect(emitirRelatorioRecursos(selecao)).rejects.toMatchObject({
      code: 'LOCKED',
      message: expect.stringMatching(/não define o período de recursos da etapa de seleção/),
    })
    expect(mockPrisma.recurso.findMany).not.toHaveBeenCalled()
    expect(mockGerarPdf).not.toHaveBeenCalled()
  })

  it('habilitação não é afetada pela janela do resultado final', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(edital([JANELA_HABILITACAO, JANELA_SELECAO_FINAL]) as never)

    await emitirRelatorioRecursos(entrada)

    expect(mockPrisma.recurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fase: 'HABILITACAO', inscricao: { editalId: 'ed-1' } } }),
    )
  })
})
