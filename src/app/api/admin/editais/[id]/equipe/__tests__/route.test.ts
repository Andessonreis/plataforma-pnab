import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, DELETE } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

function makeGetRequest(editalId = 'edital-1') {
  return new NextRequest(`http://localhost:3000/api/admin/editais/${editalId}/equipe`)
}

function makePostRequest(body: Record<string, unknown>, editalId = 'edital-1') {
  return new NextRequest(`http://localhost:3000/api/admin/editais/${editalId}/equipe`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeDeleteRequest(body: Record<string, unknown>, editalId = 'edital-1') {
  return new NextRequest(`http://localhost:3000/api/admin/editais/${editalId}/equipe`, {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'edital-1') {
  return { params: Promise.resolve({ id }) }
}

// ── GET ─────────────────────────────────────────────────────────────────────

describe('GET /api/admin/editais/[id]/equipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna membros agrupados por função', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.editalMembro.findMany.mockResolvedValue([
      { funcao: 'AVALIADOR', user: { id: 'u1', nome: 'Avaliador 1', email: 'a1@test.com' } },
      { funcao: 'AVALIADOR', user: { id: 'u2', nome: 'Avaliador 2', email: 'a2@test.com' } },
      { funcao: 'HABILITADOR', user: { id: 'u3', nome: 'Habilitador 1', email: 'h1@test.com' } },
    ] as never)

    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.avaliadores).toHaveLength(2)
    expect(body.habilitadores).toHaveLength(1)
    expect(body.avaliadores[0].nome).toBe('Avaliador 1')
    expect(body.habilitadores[0].nome).toBe('Habilitador 1')
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(403)
  })

  it('role não-admin → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'HABILITADOR' } } as never)

    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(403)
  })
})

// ── POST ──────────────────────────────────────────────────���─────────────────

describe('POST /api/admin/editais/[id]/equipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('adiciona membros → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({ id: 'edital-1' } as never)
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u1', nome: 'Avaliador 1' },
      { id: 'u2', nome: 'Avaliador 2' },
    ] as never)
    mockPrisma.editalMembro.createMany.mockResolvedValue({ count: 2 } as never)

    const res = await POST(
      makePostRequest({ userIds: ['u1', 'u2'], funcao: 'AVALIADOR' }),
      makeParams(),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.added).toBe(2)
  })

  it('createMany com skipDuplicates', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({ id: 'edital-1' } as never)
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u1', nome: 'Hab 1' },
    ] as never)
    mockPrisma.editalMembro.createMany.mockResolvedValue({ count: 1 } as never)

    await POST(
      makePostRequest({ userIds: ['u1'], funcao: 'HABILITADOR' }),
      makeParams(),
    )

    expect(mockPrisma.editalMembro.createMany).toHaveBeenCalledWith({
      data: [{ editalId: 'edital-1', userId: 'u1', funcao: 'HABILITADOR' }],
      skipDuplicates: true,
    })
  })

  it('registra audit log para cada membro', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({ id: 'edital-1' } as never)
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u1', nome: 'Avaliador 1' },
    ] as never)
    mockPrisma.editalMembro.createMany.mockResolvedValue({ count: 1 } as never)

    await POST(
      makePostRequest({ userIds: ['u1'], funcao: 'AVALIADOR' }),
      makeParams(),
    )

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'MEMBRO_EDITAL_ADICIONADO',
        entity: 'EditalMembro',
        entityId: 'edital-1',
        details: expect.objectContaining({ funcao: 'AVALIADOR', membroId: 'u1' }),
      }),
    )
  })

  it('edital não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    const res = await POST(
      makePostRequest({ userIds: ['u1'], funcao: 'AVALIADOR' }),
      makeParams(),
    )

    expect(res.status).toBe(404)
  })

  it('users inválidos → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({ id: 'edital-1' } as never)
    // Nenhum user encontrado com role correto
    mockPrisma.user.findMany.mockResolvedValue([] as never)

    const res = await POST(
      makePostRequest({ userIds: ['invalid-user'], funcao: 'AVALIADOR' }),
      makeParams(),
    )

    expect(res.status).toBe(400)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(
      makePostRequest({ userIds: ['u1'], funcao: 'AVALIADOR' }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('body inválido → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)

    const res = await POST(
      makePostRequest({ funcao: 'INVALIDO' }),
      makeParams(),
    )

    expect(res.status).toBe(400)
  })
})

// ── DELETE ──────────────────���──────────────────────��─────────────────────────

describe('DELETE /api/admin/editais/[id]/equipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('remove membro ��� 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.editalMembro.deleteMany.mockResolvedValue({ count: 1 } as never)

    const res = await DELETE(
      makeDeleteRequest({ userId: 'u1', funcao: 'AVALIADOR' }),
      makeParams(),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('registra audit log ao remover', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.editalMembro.deleteMany.mockResolvedValue({ count: 1 } as never)

    await DELETE(
      makeDeleteRequest({ userId: 'u1', funcao: 'HABILITADOR' }),
      makeParams(),
    )

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'MEMBRO_EDITAL_REMOVIDO',
        entity: 'EditalMembro',
        entityId: 'edital-1',
        details: expect.objectContaining({ funcao: 'HABILITADOR', membroId: 'u1' }),
      }),
    )
  })

  it('membro não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.editalMembro.deleteMany.mockResolvedValue({ count: 0 } as never)

    const res = await DELETE(
      makeDeleteRequest({ userId: 'u1', funcao: 'AVALIADOR' }),
      makeParams(),
    )

    expect(res.status).toBe(404)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await DELETE(
      makeDeleteRequest({ userId: 'u1', funcao: 'AVALIADOR' }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('body inválido → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)

    const res = await DELETE(
      makeDeleteRequest({ funcao: 'INVALIDO' }),
      makeParams(),
    )

    expect(res.status).toBe(400)
  })
})
