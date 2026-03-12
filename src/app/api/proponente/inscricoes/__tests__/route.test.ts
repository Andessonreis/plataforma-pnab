import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/proponente/inscricoes', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/proponente/inscricoes')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

const baseEdital = {
  id: 'edital-1',
  status: 'INSCRICOES_ABERTAS',
  ano: 2025,
  categorias: ['Musica', 'Danca'],
}

describe('POST /api/proponente/inscricoes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('cria inscricao com sucesso → 201 + numero', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(baseEdital as never)
    mockPrisma.inscricao.findFirst.mockResolvedValue(null)
    mockPrisma.inscricao.count.mockResolvedValue(3)
    mockPrisma.inscricao.create.mockResolvedValue({
      id: 'insc-new',
      numero: 'PNAB-2025-0004',
    } as never)

    const res = await POST(makePostRequest({ editalId: 'edital-1' }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('insc-new')
    expect(body.numero).toBe('PNAB-2025-0004')
  })

  it('edital nao INSCRICOES_ABERTAS → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      ...baseEdital,
      status: 'RASCUNHO',
    } as never)

    const res = await POST(makePostRequest({ editalId: 'edital-1' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('FORBIDDEN')
  })

  it('inscricao duplicada → 409 + inscricaoId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(baseEdital as never)
    mockPrisma.inscricao.findFirst.mockResolvedValue({ id: 'insc-existing' } as never)

    const res = await POST(makePostRequest({ editalId: 'edital-1' }))

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.inscricaoId).toBe('insc-existing')
  })

  it('categoria invalida → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(baseEdital as never)
    mockPrisma.inscricao.findFirst.mockResolvedValue(null)

    const res = await POST(makePostRequest({ editalId: 'edital-1', categoria: 'Teatro' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('BAD_REQUEST')
  })

  it('sem sessao → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makePostRequest({ editalId: 'edital-1' }))

    expect(res.status).toBe(401)
  })

  it('role ADMIN → 401', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makePostRequest({ editalId: 'edital-1' }))

    expect(res.status).toBe(401)
  })

  it('edital nao encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    const res = await POST(makePostRequest({ editalId: 'edital-999' }))

    expect(res.status).toBe(404)
  })

  it('audit log registrado ao criar inscricao', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(baseEdital as never)
    mockPrisma.inscricao.findFirst.mockResolvedValue(null)
    mockPrisma.inscricao.count.mockResolvedValue(0)
    mockPrisma.inscricao.create.mockResolvedValue({
      id: 'insc-new',
      numero: 'PNAB-2025-0001',
    } as never)

    await POST(makePostRequest({ editalId: 'edital-1' }))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'INSCRICAO_CRIADA',
        entity: 'Inscricao',
        entityId: 'insc-new',
      }),
    )
  })
})

describe('GET /api/proponente/inscricoes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista inscricoes do proponente → 200 + paginacao', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findMany.mockResolvedValue([
      { id: 'insc-1', numero: 'PNAB-2025-0001', status: 'RASCUNHO' },
      { id: 'insc-2', numero: 'PNAB-2025-0002', status: 'ENVIADA' },
    ] as never)
    mockPrisma.inscricao.count.mockResolvedValue(2)

    const res = await GET(makeGetRequest({ page: '1', pageSize: '10' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta.total).toBe(2)
    expect(body.meta.page).toBe(1)
    expect(body.meta.pageSize).toBe(10)
    expect(body.meta.totalPages).toBe(1)
  })

  it('sem sessao → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(401)
  })

  it('role ADMIN → 401', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(401)
  })
})
