import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { db, logarComo, req, params, questionarioPublicado, camposV1 } from './fixtures'
import { GET as obterPublico } from '../publico/[slug]/route'
import { POST as responder } from '../publico/[slug]/respostas/route'
import { GET as listarRespostas } from '../[id]/respostas/route'

beforeEach(() => {
  vi.clearAllMocks()
  logarComo(null)
  db.questionarioResposta.findUnique.mockResolvedValue(null)
  db.questionarioResposta.create.mockImplementation(({ data }) =>
    Promise.resolve({ id: 'r1', protocolo: data.protocolo, createdAt: new Date() }))
})

const slug = params({ slug: 'pesquisa-visita' })
const enviar = (body: unknown) => responder(req('/api/v1/questionarios/publico/pesquisa-visita/respostas', 'POST', body), slug)

describe('GET /api/v1/questionarios/publico/[slug]', () => {
  it('só publicado, com cache público', async () => {
    db.questionario.findFirst.mockResolvedValue({ id: 'q1', campos: camposV1 })
    const res = await obterPublico(req('/api/v1/questionarios/publico/pesquisa-visita'), slug)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=300')
    expect(db.questionario.findFirst.mock.calls[0][0].where).toEqual({ slug: 'pesquisa-visita', status: 'PUBLICADO' })
  })

  it('rascunho ou inexistente → 404', async () => {
    db.questionario.findFirst.mockResolvedValue(null)
    expect((await obterPublico(req('/x'), slug)).status).toBe(404)
  })
})

describe('POST /api/v1/questionarios/publico/[slug]/respostas', () => {
  it('grava com versão e snapshot vigentes e devolve protocolo legível', async () => {
    db.questionario.findFirst.mockResolvedValue(questionarioPublicado)
    const res = await enviar({ dados: { nome: 'Ana', turno: 'Tarde', extra: 'x' } })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.protocolo).toMatch(new RegExp(`^QST-${new Date().getFullYear()}-[2-9A-HJKMNP-Z]{6}$`))
    expect(data.mensagemSucesso).toBe('Obrigado!')
    const gravado = db.questionarioResposta.create.mock.calls[0][0].data
    expect(gravado).toMatchObject({ questionarioId: 'q1', versao: 2, camposSnapshot: camposV1, dados: { nome: 'Ana', turno: 'Tarde' } })
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'QUESTIONARIO_RESPOSTA_ENVIADA' }))
  })

  it('sorteia outro protocolo quando o primeiro já existe', async () => {
    db.questionario.findFirst.mockResolvedValue(questionarioPublicado)
    db.questionarioResposta.findUnique.mockResolvedValueOnce({ id: 'velha' }).mockResolvedValueOnce(null)
    expect((await enviar({ dados: { nome: 'Ana' } })).status).toBe(201)
    expect(db.questionarioResposta.findUnique).toHaveBeenCalledTimes(2)
  })

  it('respostas inválidas → 400 com o campo', async () => {
    db.questionario.findFirst.mockResolvedValue(questionarioPublicado)
    const res = await enviar({ dados: { turno: 'Noite' } })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(Object.keys(body.fieldErrors)).toEqual(expect.arrayContaining(['nome', 'turno']))
    expect(db.questionarioResposta.create).not.toHaveBeenCalled()
  })

  it('não publicado → 404', async () => {
    db.questionario.findFirst.mockResolvedValue({ ...questionarioPublicado, status: 'RASCUNHO' })
    expect((await enviar({ dados: { nome: 'Ana' } })).status).toBe(404)
  })

  it('exige login quando configurado', async () => {
    db.questionario.findFirst.mockResolvedValue({ ...questionarioPublicado, exigeLogin: true })
    expect((await enviar({ dados: { nome: 'Ana' } })).status).toBe(401)
    logarComo('PROPONENTE')
    expect((await enviar({ dados: { nome: 'Ana' } })).status).toBe(201)
    expect(db.questionarioResposta.create.mock.calls[0][0].data.userId).toBe('u1')
  })

  it('corpo sem dados → 400', async () => {
    expect((await enviar({ nome: 'x' })).status).toBe(400)
  })

  it('respeita o rate limit', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce(NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 }))
    const res = await enviar({ dados: {} })
    expect(res.status).toBe(429)
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
    expect(vi.mocked(rateLimit).mock.calls[0][1]).toBe('questionario/resposta')
  })
})

describe('GET /api/v1/questionarios/[id]/respostas', () => {
  const id = params({ id: 'q1' })

  it('ATENDIMENTO → 403', async () => {
    logarComo('ATENDIMENTO')
    expect((await listarRespostas(req('/api/v1/questionarios/q1/respostas'), id)).status).toBe(403)
  })

  it('lista paginada', async () => {
    logarComo('COMUNICACAO')
    db.questionario.findUnique.mockResolvedValue({ id: 'q1', slug: 'pesquisa' })
    db.questionarioResposta.findMany.mockResolvedValue([{ id: 'r1' }])
    db.questionarioResposta.count.mockResolvedValue(1)
    const res = await listarRespostas(req('/api/v1/questionarios/q1/respostas?pageSize=10'), id)
    expect((await res.json()).meta).toEqual({ page: 1, pageSize: 10, total: 1, totalPages: 1 })
  })

  it('CSV alinha versões diferentes pelo nome do campo', async () => {
    logarComo('COMUNICACAO')
    db.questionario.findUnique.mockResolvedValue({ id: 'q1', slug: 'pesquisa' })
    const v2 = [
      { nome: 'turno', label: 'Período', tipo: 'select', opcoes: ['Tarde'] },
      { nome: 'equipe', label: 'Equipe', tipo: 'tabela', colunas: [{ nome: 'n', label: 'Membro', tipo: 'texto' }] },
    ]
    db.questionarioResposta.findMany.mockResolvedValue([
      { protocolo: 'QST-1', versao: 1, camposSnapshot: camposV1, dados: { nome: 'Ana', turno: 'Manhã' }, nome: null, email: null, createdAt: new Date('2026-01-01T00:00:00Z') },
      { protocolo: 'QST-2', versao: 2, camposSnapshot: v2, dados: { turno: 'Tarde', equipe: [{ n: 'Rui' }, { n: 'Lia' }] }, nome: 'Bia', email: 'b@x.br', createdAt: new Date('2026-02-01T00:00:00Z') },
    ])
    const res = await listarRespostas(req('/api/v1/questionarios/q1/respostas?formato=csv'), id)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    expect(res.headers.get('Content-Disposition')).toContain('respostas-pesquisa.csv')
    const linhas = (await res.text()).replace(/^﻿/, '').split('\r\n')
    expect(linhas[0]).toBe('Protocolo,Enviado em,Versão,Nome,E-mail,Período,Equipe — Membro,Nome')
    expect(linhas[1]).toBe('QST-1,2026-01-01T00:00:00.000Z,1,,,Manhã,,Ana')
    expect(linhas[2]).toBe('QST-2,2026-02-01T00:00:00.000Z,2,Bia,b@x.br,Tarde,Rui | Lia,')
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'EXPORTACAO_CSV' }))
  })
})
