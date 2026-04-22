import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function makeReq(body: Record<string, unknown>, id = 'insc-1') {
  return new NextRequest(`http://localhost:3000/api/proponente/inscricoes/${id}/recurso`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeGetReq(id = 'insc-1') {
  return new NextRequest(`http://localhost:3000/api/proponente/inscricoes/${id}/recurso`)
}

function params(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/proponente/inscricoes/[id]/recurso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await POST(
      makeReq({ fase: 'HABILITACAO', texto: 'a'.repeat(25), urlAnexos: [] }),
      params(),
    )
    expect(res.status).toBe(401)
  })

  it('texto < 20 chars → 400 VALIDATION_ERROR', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    const res = await POST(
      makeReq({ fase: 'HABILITACAO', texto: 'curto', urlAnexos: [] }),
      params(),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  it('inscrição não encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)
    const res = await POST(
      makeReq({ fase: 'HABILITACAO', texto: 'motivo com tamanho suficiente' }),
      params(),
    )
    expect(res.status).toBe(404)
  })

  it('outro proponente → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-A', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      proponenteId: 'user-B',
      status: 'INABILITADA',
      editalId: 'ed-1',
    } as never)
    const res = await POST(
      makeReq({ fase: 'HABILITACAO', texto: 'motivo com tamanho suficiente' }),
      params(),
    )
    expect(res.status).toBe(403)
  })

  it('status não permite recurso na fase → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      proponenteId: 'u1',
      status: 'ENVIADA', // não permite recurso ainda
      editalId: 'ed-1',
    } as never)
    const res = await POST(
      makeReq({ fase: 'HABILITACAO', texto: 'motivo com tamanho suficiente' }),
      params(),
    )
    expect(res.status).toBe(400)
  })

  it('já existe recurso pra essa fase → 409', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      proponenteId: 'u1',
      status: 'INABILITADA',
      editalId: 'ed-1',
    } as never)
    mockPrisma.recurso.findFirst.mockResolvedValue({ id: 'rec-existente' } as never)
    const res = await POST(
      makeReq({ fase: 'HABILITACAO', texto: 'motivo com tamanho suficiente' }),
      params(),
    )
    expect(res.status).toBe(409)
  })

  it('cria recurso com urlAnexos → 201 e muda status para RECURSO_ABERTO', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      proponenteId: 'u1',
      status: 'INABILITADA',
      editalId: 'ed-1',
    } as never)
    mockPrisma.recurso.findFirst.mockResolvedValue(null)
    mockPrisma.recurso.create.mockResolvedValue({
      id: 'rec-1',
      fase: 'HABILITACAO',
    } as never)
    mockPrisma.inscricao.update.mockResolvedValue({} as never)

    const res = await POST(
      makeReq({
        fase: 'HABILITACAO',
        texto: 'Fundamentação detalhada do recurso.',
        urlAnexos: ['https://storage.example.com/a.pdf', 'https://storage.example.com/b.pdf'],
      }),
      params(),
    )

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('rec-1')
    expect(mockPrisma.recurso.create).toHaveBeenCalledWith({
      data: {
        inscricaoId: 'insc-1',
        fase: 'HABILITACAO',
        texto: 'Fundamentação detalhada do recurso.',
        urlAnexos: ['https://storage.example.com/a.pdf', 'https://storage.example.com/b.pdf'],
      },
    })
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'insc-1' },
      data: { status: 'RECURSO_ABERTO' },
    })
  })

  it('rejeita urlAnexos não-URL → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    const res = await POST(
      makeReq({
        fase: 'HABILITACAO',
        texto: 'motivo com tamanho suficiente',
        urlAnexos: ['caminho-local-nao-url'],
      }),
      params(),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/proponente/inscricoes/[id]/recurso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dono lista seus recursos → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({ proponenteId: 'u1' } as never)
    mockPrisma.recurso.findMany.mockResolvedValue([
      { id: 'r1', fase: 'HABILITACAO', texto: 't', urlAnexos: [] },
    ] as never)

    const res = await GET(makeGetReq(), params())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
  })

  it('admin/habilitador podem ver recursos de qualquer proponente → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({ proponenteId: 'u-outro' } as never)
    mockPrisma.recurso.findMany.mockResolvedValue([] as never)

    const res = await GET(makeGetReq(), params())
    expect(res.status).toBe(200)
  })

  it('outro proponente → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-outro', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({ proponenteId: 'u1' } as never)

    const res = await GET(makeGetReq(), params())
    expect(res.status).toBe(403)
  })
})
