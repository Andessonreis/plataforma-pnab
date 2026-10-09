import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAudit } from '@/lib/audit'
import { db, logarComo, req, params, corpoValido, camposV1 } from './fixtures'
import { GET as listar, POST as criar } from '../route'
import { GET as obter, PUT as atualizar, PATCH as alterarStatus, DELETE as excluir } from '../[id]/route'
import { POST as duplicar } from '../[id]/duplicar/route'

beforeEach(() => vi.clearAllMocks())

describe('permissões da gestão de questionários', () => {
  it.each([
    ['sem sessão', null],
    ['PROPONENTE', 'PROPONENTE'],
    ['ATENDIMENTO', 'ATENDIMENTO'],
  ])('%s → 403 em todas as rotas', async (_, role) => {
    logarComo(role)
    const id = params({ id: 'q1' })
    const respostas = await Promise.all([
      listar(req('/api/v1/questionarios')),
      criar(req('/api/v1/questionarios', 'POST', corpoValido)),
      obter(req('/api/v1/questionarios/q1'), id),
      atualizar(req('/api/v1/questionarios/q1', 'PUT', corpoValido), id),
      alterarStatus(req('/api/v1/questionarios/q1', 'PATCH', { status: 'PUBLICADO' }), id),
      excluir(req('/api/v1/questionarios/q1', 'DELETE'), id),
      duplicar(req('/api/v1/questionarios/q1/duplicar', 'POST'), id),
    ])
    expect(respostas.map((r) => r.status)).toEqual(Array(7).fill(403))
    expect(db.questionario.create).not.toHaveBeenCalled()
  })

  it.each(['SUPER_ADMIN', 'ADMIN'])('%s passa', async (role) => {
    logarComo(role)
    db.questionario.findMany.mockResolvedValue([])
    db.questionario.count.mockResolvedValue(0)
    expect((await listar(req('/api/v1/questionarios'))).status).toBe(200)
  })
})

describe('GET /api/v1/questionarios', () => {
  it('pagina com pageSize limitado a 50', async () => {
    logarComo('COMUNICACAO')
    db.questionario.findMany.mockResolvedValue([{ id: 'q1' }])
    db.questionario.count.mockResolvedValue(51)
    const res = await listar(req('/api/v1/questionarios?page=2&pageSize=50&status=PUBLICADO'))
    const body = await res.json()
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(body.meta).toEqual({ page: 2, pageSize: 50, total: 51, totalPages: 2 })
    expect(db.questionario.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 50, take: 50, where: { status: 'PUBLICADO' } }))
    expect((await listar(req('/api/v1/questionarios?pageSize=51'))).status).toBe(400)
  })
})

describe('POST /api/v1/questionarios', () => {
  beforeEach(() => logarComo('COMUNICACAO'))

  it('cria e audita', async () => {
    db.questionario.findUnique.mockResolvedValue(null)
    db.questionario.create.mockResolvedValue({ id: 'q1', slug: 'pesquisa-visita', finalidade: 'x' })
    const res = await criar(req('/api/v1/questionarios', 'POST', corpoValido))
    expect(res.status).toBe(201)
    expect(db.questionario.create.mock.calls[0][0].data).toMatchObject({ slug: 'pesquisa-visita', criadoPorId: 'u1' })
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'QUESTIONARIO_CRIADO' }))
  })

  it('slug em uso → 409', async () => {
    db.questionario.findUnique.mockResolvedValue({ id: 'outro' })
    expect((await criar(req('/api/v1/questionarios', 'POST', corpoValido))).status).toBe(409)
  })

  it('campos inválidos → 400 com fieldErrors', async () => {
    const res = await criar(req('/api/v1/questionarios', 'POST', { ...corpoValido, campos: [{ nome: 's', label: 'S', tipo: 'select' }] }))
    expect(res.status).toBe(400)
    expect((await res.json()).fieldErrors['campos.0.opcoes']).toMatch(/opção/)
  })
})

describe('PUT /api/v1/questionarios/[id]', () => {
  beforeEach(() => logarComo('COMUNICACAO'))
  const id = params({ id: 'q1' })

  it('sobe a versão quando os campos mudam', async () => {
    db.questionario.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(where.id ? { id: 'q1', slug: 'pesquisa-visita', status: 'RASCUNHO', campos: camposV1 } : { id: 'q1' }))
    db.questionario.update.mockResolvedValue({ id: 'q1', slug: 'pesquisa-visita', status: 'RASCUNHO', versao: 2 })
    const novosCampos = [...camposV1, { nome: 'idade', label: 'Idade', tipo: 'numero' }]
    const res = await atualizar(req('/api/v1/questionarios/q1', 'PUT', { ...corpoValido, campos: novosCampos }), id)
    expect(res.status).toBe(200)
    expect(db.questionario.update.mock.calls[0][0].data.versao).toEqual({ increment: 1 })
  })

  it('mantém a versão quando só o texto muda e audita publicação', async () => {
    db.questionario.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(where.id ? { id: 'q1', slug: 'pesquisa-visita', status: 'RASCUNHO', campos: camposV1 } : { id: 'q1' }))
    db.questionario.update.mockResolvedValue({ id: 'q1', slug: 'pesquisa-visita', status: 'PUBLICADO', versao: 1 })
    await atualizar(req('/api/v1/questionarios/q1', 'PUT', { ...corpoValido, titulo: 'Outro título', status: 'PUBLICADO' }), id)
    expect(db.questionario.update.mock.calls[0][0].data.versao).toBeUndefined()
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'QUESTIONARIO_PUBLICADO' }))
  })

  it('inexistente → 404', async () => {
    db.questionario.findUnique.mockResolvedValue(null)
    expect((await atualizar(req('/api/v1/questionarios/q1', 'PUT', corpoValido), id)).status).toBe(404)
  })
})

describe('PATCH, DELETE e duplicar', () => {
  beforeEach(() => logarComo('COMUNICACAO'))
  const id = params({ id: 'q1' })

  it('PATCH arquiva', async () => {
    db.questionario.findUnique.mockResolvedValue({ id: 'q1', slug: 's', status: 'PUBLICADO' })
    db.questionario.update.mockResolvedValue({ id: 'q1', status: 'ARQUIVADO' })
    const res = await alterarStatus(req('/api/v1/questionarios/q1', 'PATCH', { status: 'ARQUIVADO' }), id)
    expect(res.status).toBe(200)
    expect(db.questionario.update).toHaveBeenCalledWith({ where: { id: 'q1' }, data: { status: 'ARQUIVADO' } })
  })

  it('DELETE com respostas → 409; sem respostas → 204', async () => {
    db.questionario.findUnique.mockResolvedValue({ id: 'q1', slug: 's' })
    db.questionarioResposta.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0)
    expect((await excluir(req('/api/v1/questionarios/q1', 'DELETE'), id)).status).toBe(409)
    expect((await excluir(req('/api/v1/questionarios/q1', 'DELETE'), id)).status).toBe(204)
    expect(db.questionario.delete).toHaveBeenCalledTimes(1)
  })

  it('duplicar cria rascunho com slug livre', async () => {
    db.questionario.findUnique.mockImplementation(({ where }) => {
      if (where.id) return Promise.resolve({ id: 'q1', slug: 'pesquisa', titulo: 'Pesquisa', finalidade: 'f', campos: camposV1, exigeLogin: false })
      return Promise.resolve(where.slug === 'pesquisa-copia' ? { id: 'q2' } : null)
    })
    db.questionario.create.mockResolvedValue({ id: 'q3', slug: 'pesquisa-copia-2' })
    const res = await duplicar(req('/api/v1/questionarios/q1/duplicar', 'POST'), id)
    expect(res.status).toBe(201)
    expect(db.questionario.create.mock.calls[0][0].data).toMatchObject({ slug: 'pesquisa-copia-2', status: 'RASCUNHO', titulo: 'Pesquisa (cópia)' })
  })
})
