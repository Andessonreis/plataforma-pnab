import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { registrarEmissao } from '@/lib/documentos/emissao'
import { templatePreferido } from '@/lib/documentos/preferencia'
import { generateListaClassificacao } from '@/lib/pdf/lista-classificacao'
import { gerarListaClassificacaoV1 } from '@/lib/pdf/template-1/lista-classificacao'
import { montarClassificacao } from '@/lib/results/classificacao'
import { makeReq, params, prepararCenarioPadrao } from './route.fixtures'

vi.mock('@/lib/results/classificacao', () => ({ montarClassificacao: vi.fn() }))
vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn() }))
vi.mock('@/lib/documentos/preferencia', () => ({ templatePreferido: vi.fn() }))
vi.mock('@/lib/pdf/lista-classificacao', () => ({ generateListaClassificacao: vi.fn() }))
vi.mock('@/lib/pdf/template-1/lista-classificacao', () => ({ gerarListaClassificacaoV1: vi.fn() }))

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockMontar = vi.mocked(montarClassificacao)
const mockRegistrar = vi.mocked(registrarEmissao)
const mockPreferido = vi.mocked(templatePreferido)
const mockGeradorV1 = vi.mocked(gerarListaClassificacaoV1)
const mockGeradorV2 = vi.mocked(generateListaClassificacao)

describe('GET /api/admin/editais/[id]/classificacao', () => {
  beforeEach(prepararCenarioPadrao)

  it.each([null, { user: { id: 'u', role: 'AVALIADOR' } }])('sem sessão de admin → 403', async (sessao) => {
    mockAuth.mockResolvedValue(sessao as never)

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(403)
    expect(mockMontar).not.toHaveBeenCalled()
  })

  it.each(['0', '3', '01', 'v1', ''])('template=%s inválido → 400 sem consultar nem emitir', async (valor) => {
    const res = await GET(makeReq(`?template=${valor}`), params())

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'BAD_REQUEST', message: expect.stringContaining('template') })
    expect(mockPrisma.edital.findUnique).not.toHaveBeenCalled()
    expect(mockRegistrar).not.toHaveBeenCalled()
  })

  it('edital inexistente → 404', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(404)
  })

  it('nenhuma inscrição avaliada → 422', async () => {
    mockMontar.mockResolvedValue([])

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(422)
    expect(mockRegistrar).not.toHaveBeenCalled()
  })

  describe('escolha do layout', () => {
    it('template=1: usa o gerador do layout anterior e registra a emissão na versão 1', async () => {
      const res = await GET(makeReq('?template=1'), params())

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/pdf')
      expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('%PDF-v1')
      expect(mockGeradorV1).toHaveBeenCalledTimes(1)
      expect(mockGeradorV2).not.toHaveBeenCalled()
      expect(mockRegistrar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'CLASSIFICACAO', template: 1 }))
      expect(mockPreferido).not.toHaveBeenCalled()
    })

    it('template=2: usa o gerador do padrão Diário Oficial', async () => {
      const res = await GET(makeReq('?template=2'), params())

      expect(res.status).toBe(200)
      expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('%PDF-v2')
      expect(mockGeradorV2).toHaveBeenCalledTimes(1)
      expect(mockGeradorV1).not.toHaveBeenCalled()
      expect(mockRegistrar).toHaveBeenCalledWith(expect.objectContaining({ template: 2 }))
    })

    it('sem template: segue a preferência de quem emite naquele edital', async () => {
      mockPreferido.mockResolvedValue(1)

      await GET(makeReq(), params())

      expect(mockPreferido).toHaveBeenCalledWith('admin-1', 'ed-1')
      expect(mockGeradorV1).toHaveBeenCalledTimes(1)
      expect(mockRegistrar).toHaveBeenCalledWith(expect.objectContaining({ template: 1 }))
    })

    it('falha do gerador → 500 sem vazar a causa', async () => {
      mockGeradorV1.mockRejectedValue(new Error('pdfkit quebrou em /srv/app'))

      const res = await GET(makeReq('?template=1'), params())

      expect(res.status).toBe(500)
      expect(JSON.stringify(await res.json())).not.toContain('/srv/app')
    })
  })
})
