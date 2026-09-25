import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitirRelatorioRecursos } from '../relatorio-recursos.service'
import { descartarEmissao, registrarEmissao } from '@/lib/documentos/emissao'
import { templatePreferido } from '@/lib/documentos/preferencia'
import { generateRelatorioRecursos } from '@/lib/pdf/relatorio-recursos'
import { gerarRelatorioRecursosV1 } from '@/lib/pdf/template-1/relatorio-recursos'
import { EMISSAO, entrada, prepararCenarioPadrao } from './relatorio-recursos.fixtures'

vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn(), descartarEmissao: vi.fn() }))
vi.mock('@/lib/pdf/relatorio-recursos', () => ({ generateRelatorioRecursos: vi.fn() }))
vi.mock('@/lib/pdf/template-1/relatorio-recursos', () => ({ gerarRelatorioRecursosV1: vi.fn() }))
vi.mock('@/lib/documentos/preferencia', () => ({ templatePreferido: vi.fn() }))

const mockRegistrarEmissao = vi.mocked(registrarEmissao)
const mockDescartarEmissao = vi.mocked(descartarEmissao)
const mockPreferido = vi.mocked(templatePreferido)
const mockGeradorV1 = vi.mocked(gerarRelatorioRecursosV1)
const mockGeradorV2 = vi.mocked(generateRelatorioRecursos)

describe('extrato de recursos — versão do layout', () => {
  beforeEach(prepararCenarioPadrao)
  afterEach(() => vi.useRealTimers())

  it('template 1 pedido: gera pelo layout anterior e registra a emissão na versão 1', async () => {
    const resultado = await emitirRelatorioRecursos({ ...entrada, template: 1 })

    expect(mockGeradorV1).toHaveBeenCalledWith(expect.objectContaining({ etapa: 'Habilitação', emissao: EMISSAO }))
    expect(mockGeradorV2).not.toHaveBeenCalled()
    expect(mockRegistrarEmissao).toHaveBeenCalledWith(expect.objectContaining({ template: 1 }))
    expect(resultado.buffer.toString()).toBe('%PDF-fake-v1')
  })

  it('template 2 pedido: gera pelo padrão Diário Oficial', async () => {
    const resultado = await emitirRelatorioRecursos({ ...entrada, template: 2 })

    expect(mockGeradorV2).toHaveBeenCalledTimes(1)
    expect(mockGeradorV1).not.toHaveBeenCalled()
    expect(mockRegistrarEmissao).toHaveBeenCalledWith(expect.objectContaining({ template: 2 }))
    expect(resultado.buffer.toString()).toBe('%PDF-fake')
  })

  it('template pedido dispensa a consulta à preferência', async () => {
    await emitirRelatorioRecursos({ ...entrada, template: 1 })

    expect(mockPreferido).not.toHaveBeenCalled()
  })

  it('sem template: usa a preferência de quem emite naquele edital', async () => {
    mockPreferido.mockResolvedValue(1)

    await emitirRelatorioRecursos(entrada)

    expect(mockPreferido).toHaveBeenCalledWith('admin-1', 'ed-1')
    expect(mockGeradorV1).toHaveBeenCalledTimes(1)
    expect(mockGeradorV2).not.toHaveBeenCalled()
    expect(mockRegistrarEmissao).toHaveBeenCalledWith(expect.objectContaining({ template: 1 }))
  })

  it('falha no gerador da versão 1: descarta a emissão registrada', async () => {
    mockGeradorV1.mockRejectedValue(new Error('pdfkit quebrou'))

    await expect(emitirRelatorioRecursos({ ...entrada, template: 1 })).rejects.toThrow('pdfkit quebrou')

    expect(mockDescartarEmissao).toHaveBeenCalledWith('PNAB-ABCD-2345')
  })
})
