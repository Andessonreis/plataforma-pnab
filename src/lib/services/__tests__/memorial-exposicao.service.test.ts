import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAudit } from '@/lib/audit'
import { ServiceError } from '../errors'

const db = vi.hoisted(() => ({
  memorialExposicao: {
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  memorialVersao: { findFirst: vi.fn(), create: vi.fn() },
}))
vi.mock('@/lib/db', () => ({ prisma: db }))

const servico = await import('../memorial-exposicao.service')

const comunicacao = { userId: 'u1', role: 'COMUNICACAO' as const }
const entrada = {
  titulo: 'Re-Tratos do Tempo: Tecendo as Memórias',
  subtitulo: null,
  descricao: null,
  periodo: null,
  localizacao: null,
  capaUrl: null,
  dataInicio: null,
  dataFim: null,
  destaque: false,
  ordem: 0,
}
const registro = { id: 'e1', slug: 're-tratos-do-tempo', status: 'APROVADO', titulo: 'Re-Tratos', descricao: 'Texto', capaUrl: '/api/arquivos/memorial/exposicoes/c.jpg' }

beforeEach(() => {
  vi.clearAllMocks()
  db.memorialVersao.findFirst.mockResolvedValue(null)
})

describe('memorial-exposicao.service', () => {
  it('cria com slug derivado do título, sufixo quando já existe, versão 1 e auditoria', async () => {
    db.memorialExposicao.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0)
    db.memorialExposicao.create.mockImplementation(async ({ data }) => ({ id: 'e1', ...data }))

    const r = await servico.criar(entrada, comunicacao)

    expect(r.slug).toBe('re-tratos-do-tempo-tecendo-as-memorias-2')
    expect(db.memorialVersao.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ entidade: 'MemorialExposicao', entidadeId: 'e1', versao: 1 }),
    })
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'MEMORIAL_CONTEUDO_CRIADO' }))
  })

  it('slug escolhido e já usado vira conflito', async () => {
    db.memorialExposicao.count.mockResolvedValue(1)
    await expect(servico.criar({ ...entrada, slug: 'sao-joao' }, comunicacao)).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('atualizar gera nova versão numerada depois da última', async () => {
    db.memorialExposicao.findUnique.mockResolvedValue(registro)
    db.memorialExposicao.update.mockResolvedValue({ ...registro, titulo: entrada.titulo })
    db.memorialVersao.findFirst.mockResolvedValue({ versao: 3 })

    await servico.atualizar('e1', entrada, comunicacao)

    expect(db.memorialVersao.create).toHaveBeenCalledWith({ data: expect.objectContaining({ versao: 4 }) })
  })

  it('publicar exige papel editorial', async () => {
    db.memorialExposicao.findUnique.mockResolvedValue(registro)
    await expect(servico.mudarStatus('e1', 'PUBLICADO', { userId: 'u2', role: 'ATENDIMENTO' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('publicar sem capa é barrado com a lista do que falta', async () => {
    db.memorialExposicao.findUnique.mockResolvedValue({ ...registro, capaUrl: null })
    const erro = await servico.mudarStatus('e1', 'PUBLICADO', comunicacao).catch((e) => e)
    expect(erro).toBeInstanceOf(ServiceError)
    expect(erro.message).toContain('imagem de capa')
    expect(db.memorialExposicao.update).not.toHaveBeenCalled()
  })

  it('transição fora do fluxo é recusada', async () => {
    db.memorialExposicao.findUnique.mockResolvedValue({ ...registro, status: 'RASCUNHO' })
    await expect(servico.mudarStatus('e1', 'PUBLICADO', comunicacao)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('publica quando aprovado e completo, registrando a ação de publicação', async () => {
    db.memorialExposicao.findUnique.mockResolvedValue(registro)
    db.memorialExposicao.update.mockResolvedValue({ ...registro, status: 'PUBLICADO' })

    const r = await servico.mudarStatus('e1', 'PUBLICADO', comunicacao)

    expect(r.status).toBe('PUBLICADO')
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'MEMORIAL_CONTEUDO_PUBLICADO', details: expect.objectContaining({ de: 'APROVADO' }) }),
    )
  })

  it('excluir inexistente responde 404', async () => {
    db.memorialExposicao.findUnique.mockResolvedValue(null)
    await expect(servico.excluir('x', comunicacao)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})
