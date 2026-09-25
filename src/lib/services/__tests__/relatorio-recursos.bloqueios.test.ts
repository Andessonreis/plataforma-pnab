import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitirRelatorioRecursos } from '../relatorio-recursos.service'
import { ServiceError } from '../errors'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { registrarEmissao } from '@/lib/documentos/emissao'
import { generateRelatorioRecursos } from '@/lib/pdf/relatorio-recursos'
import { JANELA_HABILITACAO, JANELA_SELECAO, edital, entrada, prepararCenarioPadrao } from './relatorio-recursos.fixtures'

vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn(), descartarEmissao: vi.fn() }))
vi.mock('@/lib/pdf/relatorio-recursos', () => ({ generateRelatorioRecursos: vi.fn() }))
vi.mock('@/lib/pdf/template-1/relatorio-recursos', () => ({ gerarRelatorioRecursosV1: vi.fn() }))
vi.mock('@/lib/documentos/preferencia', () => ({ templatePreferido: vi.fn() }))

const mockPrisma = vi.mocked(prisma)
const mockRegistrarEmissao = vi.mocked(registrarEmissao)
const mockGerarPdf = vi.mocked(generateRelatorioRecursos)
const mockLogAudit = vi.mocked(logAudit)

async function esperarBloqueio(mensagem: RegExp) {
  const erro = await emitirRelatorioRecursos(entrada).catch((e) => e)

  expect(erro).toBeInstanceOf(ServiceError)
  expect(erro.code).toBe('LOCKED')
  expect(erro.message).toMatch(mensagem)
  expect(mockRegistrarEmissao).not.toHaveBeenCalled()
  expect(mockGerarPdf).not.toHaveBeenCalled()
  expect(mockLogAudit).not.toHaveBeenCalled()
}

describe('extrato de recursos — bloqueios', () => {
  beforeEach(prepararCenarioPadrao)
  afterEach(() => vi.useRealTimers())

  it('prazo em curso → LOCKED, dizendo que ainda não terminou', async () => {
    vi.setSystemTime(new Date('2026-09-17T12:00:00-03:00'))
    await esperarBloqueio(/ainda não terminou \(16\/09\/2026 a 18\/09\/2026\)/)
  })

  it('prazo que ainda não abriu → LOCKED, dizendo quando abre', async () => {
    vi.setSystemTime(new Date('2026-09-10T12:00:00-03:00'))
    await esperarBloqueio(/ainda não começou \(abre em 16\/09\/2026\)/)
  })

  it('cronograma sem a janela da etapa → LOCKED', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(edital([JANELA_SELECAO]) as never)
    await esperarBloqueio(/não define o período de recursos da etapa de habilitação/)
  })

  it('janela sem data de término → LOCKED', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(
      edital([{ ...JANELA_HABILITACAO, fimEm: undefined }]) as never,
    )
    await esperarBloqueio(/não define o período de recursos/)
  })

  it('escolhe a janela com fim mesmo havendo item da mesma ação, sem fim e mais recente', async () => {
    const marcoPontual = {
      tipo: 'custom',
      label: 'Marco pontual',
      dataHora: '2026-09-30T00:00:00',
      acao: 'RECURSO_HABILITACAO_JANELA',
    }
    mockPrisma.edital.findUnique.mockResolvedValue(edital([JANELA_HABILITACAO, marcoPontual]) as never)

    await emitirRelatorioRecursos(entrada)

    expect(mockGerarPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        prazo: {
          inicio: new Date('2026-09-16T00:00:00-03:00'),
          fim: new Date('2026-09-18T23:59:00-03:00'),
        },
      }),
    )
  })

  it('edital inexistente → NOT_FOUND', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    await expect(emitirRelatorioRecursos(entrada)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(mockGerarPdf).not.toHaveBeenCalled()
  })
})
