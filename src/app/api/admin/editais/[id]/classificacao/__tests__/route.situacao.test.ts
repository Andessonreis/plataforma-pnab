import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '../route'
import { prisma } from '@/lib/db'
import { registrarEmissao } from '@/lib/documentos/emissao'
import { generateListaClassificacao } from '@/lib/pdf/lista-classificacao'
import { EDITAL, makeReq, params, prepararCenarioPadrao } from './route.fixtures'

vi.mock('@/lib/results/classificacao', () => ({ montarClassificacao: vi.fn() }))
vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn() }))
vi.mock('@/lib/documentos/preferencia', () => ({ templatePreferido: vi.fn() }))
vi.mock('@/lib/pdf/lista-classificacao', () => ({ generateListaClassificacao: vi.fn() }))
vi.mock('@/lib/pdf/template-1/lista-classificacao', () => ({ gerarListaClassificacaoV1: vi.fn() }))

const mockPrisma = vi.mocked(prisma)
const mockRegistrar = vi.mocked(registrarEmissao)
const mockGerador = vi.mocked(generateListaClassificacao)

const IDENTIFICACAO = 'Festival de Arte e Cultura (2026)'

/** Cada linha: notas já consolidadas?, fase do edital → situação, nome do arquivo e textos do registro. */
const CASOS = [
  {
    consolidadas: 0, status: 'AVALIACAO', situacao: 'PREVIA',
    arquivo: 'classificacao-previa', titulo: 'Classificação — Prévia de Trabalho', rotulo: 'Prévia — não publicável',
  },
  {
    // Sem nota consolidada não há resultado, nem que o edital já esteja na fase final.
    consolidadas: 0, status: 'RESULTADO_FINAL', situacao: 'PREVIA',
    arquivo: 'classificacao-previa', titulo: 'Classificação — Prévia de Trabalho', rotulo: 'Prévia — não publicável',
  },
  {
    consolidadas: 4, status: 'RESULTADO_PRELIMINAR', situacao: 'CONSOLIDADA',
    arquivo: 'classificacao', titulo: 'Classificação por Categoria', rotulo: 'Resultado consolidado',
  },
  {
    consolidadas: 4, status: 'RESULTADO_FINAL', situacao: 'FINAL',
    arquivo: 'resultado-final', titulo: 'Resultado Final da Classificação', rotulo: 'Resultado final após recursos',
  },
  {
    consolidadas: 4, status: 'ENCERRADO', situacao: 'FINAL',
    arquivo: 'resultado-final', titulo: 'Resultado Final da Classificação', rotulo: 'Resultado final após recursos',
  },
]

describe('GET /api/admin/editais/[id]/classificacao — situação do documento', () => {
  beforeEach(() => {
    prepararCenarioPadrao()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-25T15:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it.each(CASOS)(
    '$consolidadas nota(s) consolidada(s) com o edital em $status → $situacao',
    async ({ consolidadas, status, situacao, arquivo, titulo, rotulo }) => {
      mockPrisma.inscricao.count.mockResolvedValue(consolidadas as never)
      mockPrisma.edital.findUnique.mockResolvedValue({ ...EDITAL, status } as never)

      const res = await GET(makeReq('?template=2'), params())

      expect(res.status).toBe(200)
      expect(mockGerador).toHaveBeenCalledWith(expect.objectContaining({ situacao }))
      expect(res.headers.get('Content-Disposition')).toBe(
        `attachment; filename="${arquivo}_festival_2026-09-25.pdf"`,
      )
      expect(mockRegistrar).toHaveBeenCalledWith(expect.objectContaining({
        titulo: `${titulo} — ${IDENTIFICACAO}`,
        metadados: expect.objectContaining({ Situação: rotulo }),
      }))
    },
  )
})
