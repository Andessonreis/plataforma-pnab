import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitirRelatorioRecursos } from '../relatorio-recursos.service'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { registrarEmissao } from '@/lib/documentos/emissao'
import { generateRelatorioRecursos } from '@/lib/pdf/relatorio-recursos'
import { entrada, prepararCenarioPadrao, recursoDoBanco } from './relatorio-recursos.fixtures'

vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn(), descartarEmissao: vi.fn() }))
vi.mock('@/lib/pdf/relatorio-recursos', () => ({ generateRelatorioRecursos: vi.fn() }))

const mockPrisma = vi.mocked(prisma)
const mockRegistrarEmissao = vi.mocked(registrarEmissao)
const mockGerarPdf = vi.mocked(generateRelatorioRecursos)
const mockLogAudit = vi.mocked(logAudit)

// Janela de habilitação: 16/09 00:00 a 18/09 23:59 (horário de Brasília).
describe('extrato — recursos protocolados fora do prazo', () => {
  beforeEach(prepararCenarioPadrao)
  afterEach(() => vi.useRealTimers())

  it('marca o que veio antes da abertura ou depois do fim, sem esconder nenhum', async () => {
    mockPrisma.recurso.findMany.mockResolvedValue([
      recursoDoBanco('PNAB-2026-0001', '2026-09-15T20:00:00-03:00', 'INDEFERIDO'),
      recursoDoBanco('PNAB-2026-0002', '2026-09-17T10:00:00-03:00', 'DEFERIDO'),
      recursoDoBanco('PNAB-2026-0003', '2026-09-19T08:00:00-03:00', null),
    ] as never)

    await emitirRelatorioRecursos(entrada)

    const dados = mockGerarPdf.mock.calls[0][0]
    expect(dados.recursos.map((r) => r.situacao)).toEqual([
      'Indeferido (fora do prazo)',
      'Deferido',
      'Em análise (fora do prazo)',
    ])
    expect(dados.foraDoPrazo).toBe(2)
  })

  it('informa a contagem na verificação pública e na auditoria', async () => {
    mockPrisma.recurso.findMany.mockResolvedValue([
      recursoDoBanco('PNAB-2026-0001', '2026-09-15T20:00:00-03:00', 'INDEFERIDO'),
      recursoDoBanco('PNAB-2026-0002', '2026-09-17T10:00:00-03:00', 'DEFERIDO'),
    ] as never)

    await emitirRelatorioRecursos(entrada)

    const chamada = mockRegistrarEmissao.mock.calls[0][0]
    expect(chamada.metadados).toMatchObject({ 'Recursos interpostos': 2, 'Fora do prazo': 1 })
    expect(chamada.conteudo).toMatchObject({
      recursos: [{ situacao: 'Indeferido (fora do prazo)' }, { situacao: 'Deferido' }],
    })
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ details: expect.objectContaining({ foraDoPrazo: 1 }) }),
    )
  })

  it('todos dentro do prazo: nada é marcado e a verificação não cita fora do prazo', async () => {
    mockPrisma.recurso.findMany.mockResolvedValue([
      recursoDoBanco('PNAB-2026-0001', '2026-09-16T00:00:00-03:00', 'DEFERIDO'),
      recursoDoBanco('PNAB-2026-0002', '2026-09-18T23:59:00-03:00', 'INDEFERIDO'),
    ] as never)

    await emitirRelatorioRecursos(entrada)

    const dados = mockGerarPdf.mock.calls[0][0]
    expect(dados.recursos.map((r) => r.situacao)).toEqual(['Deferido', 'Indeferido'])
    expect(dados.foraDoPrazo).toBe(0)
    expect(mockRegistrarEmissao.mock.calls[0][0].metadados).not.toHaveProperty('Fora do prazo')
  })
})
