import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { prisma } from '@/lib/db'
import { gerarListaClassificacaoV1 } from '@/lib/pdf/template-1/lista-classificacao'
import { montarClassificacao } from '@/lib/results/classificacao'
import { EDITAL, ITENS_BONUS, comoUsuario, makeReq, params, prepararCenarioPadrao } from './route.fixtures'

vi.mock('@/lib/results/classificacao', () => ({ montarClassificacao: vi.fn() }))
vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn() }))
vi.mock('@/lib/documentos/preferencia', () => ({ templatePreferido: vi.fn() }))
vi.mock('@/lib/pdf/lista-classificacao', () => ({ generateListaClassificacao: vi.fn() }))
vi.mock('@/lib/pdf/template-1/lista-classificacao', () => ({ gerarListaClassificacaoV1: vi.fn() }))

const mockPrisma = vi.mocked(prisma)
const mockMontar = vi.mocked(montarClassificacao)
const mockGeradorV1 = vi.mocked(gerarListaClassificacaoV1)

describe('GET /api/admin/editais/[id]/classificacao — bonificação no PDF', () => {
  beforeEach(prepararCenarioPadrao)

  it('SUPER_ADMIN: passa a configuração do edital e os itens marcados em cada linha', async () => {
    comoUsuario('SUPER_ADMIN')

    await GET(makeReq('?template=1'), params())

    expect(mockMontar).toHaveBeenCalledWith('ed-1', expect.objectContaining({ incluirBonus: true }))
    const dados = mockGeradorV1.mock.calls[0][0]
    expect(dados.mostraBonus).toBe(true)
    expect(dados.bonus).toEqual(ITENS_BONUS)
    expect(dados.categorias[0].linhas[0].bonusItens).toEqual(['pcd'])
  })

  it('ADMIN com o bônus liberado pelo edital: também recebe a configuração', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue({ ...EDITAL, bonusVisivelParaAdmin: true } as never)

    await GET(makeReq('?template=1'), params())

    const dados = mockGeradorV1.mock.calls[0][0]
    expect(dados.mostraBonus).toBe(true)
    expect(dados.bonus).toEqual(ITENS_BONUS)
  })

  it('ADMIN sem o bônus liberado: nenhuma configuração vai ao gerador', async () => {
    await GET(makeReq('?template=1'), params())

    expect(mockMontar).toHaveBeenCalledWith('ed-1', expect.objectContaining({ incluirBonus: false }))
    const dados = mockGeradorV1.mock.calls[0][0]
    expect(dados.mostraBonus).toBe(false)
    expect(dados.bonus).toBeNull()
  })

  it('edital sem itens de bonificação: bonus nulo mesmo com o bônus visível', async () => {
    comoUsuario('SUPER_ADMIN')
    mockPrisma.edital.findUnique.mockResolvedValue({ ...EDITAL, itensBonus: null } as never)

    await GET(makeReq('?template=1'), params())

    expect(mockGeradorV1.mock.calls[0][0].bonus).toBeNull()
  })
})
