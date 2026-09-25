import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitirRelatorioRecursos } from '../relatorio-recursos.service'
import { registrarEmissao } from '@/lib/documentos/emissao'
import { generateRelatorioRecursos } from '@/lib/pdf/relatorio-recursos'
import { gerarRelatorioRecursosV1 } from '@/lib/pdf/template-1/relatorio-recursos'
import { entrada, prepararCenarioPadrao } from './relatorio-recursos.fixtures'

vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn(), descartarEmissao: vi.fn() }))
vi.mock('@/lib/pdf/relatorio-recursos', () => ({ generateRelatorioRecursos: vi.fn() }))
vi.mock('@/lib/pdf/template-1/relatorio-recursos', () => ({ gerarRelatorioRecursosV1: vi.fn() }))
vi.mock('@/lib/documentos/preferencia', () => ({ templatePreferido: vi.fn() }))

const mockRegistrarEmissao = vi.mocked(registrarEmissao)
const GERADORES = { 1: vi.mocked(gerarRelatorioRecursosV1), 2: vi.mocked(generateRelatorioRecursos) }

describe('extrato de recursos — coluna de protocolo', () => {
  beforeEach(prepararCenarioPadrao)
  afterEach(() => vi.useRealTimers())

  it.each([1, 2] as const)('ocultarProtocolo: chega ao gerador da versão %i e fica nos metadados da emissão', async (template) => {
    await emitirRelatorioRecursos({ ...entrada, template, ocultarProtocolo: true })

    expect(GERADORES[template]).toHaveBeenCalledWith(expect.objectContaining({ ocultarProtocolo: true }))
    expect(mockRegistrarEmissao.mock.calls[0][0].metadados).toMatchObject({ 'Coluna de protocolo': 'oculta' })
  })

  it.each([undefined, false])('ocultarProtocolo %s: o extrato sai com o protocolo e os metadados não citam a coluna', async (valor) => {
    await emitirRelatorioRecursos({ ...entrada, template: 2, ocultarProtocolo: valor })

    expect(GERADORES[2].mock.calls[0][0].ocultarProtocolo).toBeFalsy()
    expect(mockRegistrarEmissao.mock.calls[0][0].metadados).not.toHaveProperty('Coluna de protocolo')
  })
})
