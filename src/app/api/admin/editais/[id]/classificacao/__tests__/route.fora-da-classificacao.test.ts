import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { generateListaClassificacao } from '@/lib/pdf/lista-classificacao'
import { gerarListaClassificacaoV1 } from '@/lib/pdf/template-1/lista-classificacao'
import { montarClassificacao } from '@/lib/results/classificacao'
import { INSCRICOES_FORA_DA_CLASSIFICACAO } from '@/lib/results/resultado-publico'
import { categoriaComLinhas, linhaClassificada, makeReq, params, prepararCenarioPadrao } from './route.fixtures'

vi.mock('@/lib/results/classificacao', () => ({ montarClassificacao: vi.fn() }))
vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn() }))
vi.mock('@/lib/documentos/preferencia', () => ({ templatePreferido: vi.fn() }))
vi.mock('@/lib/pdf/lista-classificacao', () => ({ generateListaClassificacao: vi.fn() }))
vi.mock('@/lib/pdf/template-1/lista-classificacao', () => ({ gerarListaClassificacaoV1: vi.fn() }))

const GERADORES = { 1: vi.mocked(gerarListaClassificacaoV1), 2: vi.mocked(generateListaClassificacao) }
const [FORA] = INSCRICOES_FORA_DA_CLASSIFICACAO

describe('GET /api/admin/editais/[id]/classificacao — inscrição fora da classificação', () => {
  beforeEach(() => {
    prepararCenarioPadrao()
    vi.mocked(montarClassificacao).mockResolvedValue(categoriaComLinhas([
      linhaClassificada('PNAB-2026-0001'),
      linhaClassificada(FORA, { posicao: 2, status: 'CONTEMPLADA' }),
      linhaClassificada('PNAB-2026-0047', { posicao: 3, status: 'SUPLENTE' }),
    ]))
  })

  it.each([1, 2] as const)('versão %i: quem está na lista sai como "não se aplica" e sem avaliação', async (template) => {
    await GET(makeReq(`?template=${template}`), params())

    const linhas = GERADORES[template].mock.calls[0][0].categorias[0].linhas
    expect(linhas.find((l) => l.numero === FORA)).toMatchObject({ status: 'NAO_SE_APLICA', semAvaliacao: true })
  })

  it('não mexe nas demais inscrições', async () => {
    await GET(makeReq('?template=1'), params())

    const linhas = GERADORES[1].mock.calls[0][0].categorias[0].linhas
    expect(linhas.filter((l) => l.numero !== FORA).map((l) => [l.numero, l.status, l.semAvaliacao])).toEqual([
      ['PNAB-2026-0001', 'CONTEMPLADA', false],
      ['PNAB-2026-0047', 'SUPLENTE', false],
    ])
  })
})
