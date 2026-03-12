import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

function makeGetRequest(id = 'insc-1') {
  return new NextRequest(`http://localhost:3000/api/admin/inscricoes/${id}/avaliacao`, {
    method: 'GET',
  })
}

function makePutRequest(body: Record<string, unknown>, id = 'insc-1') {
  return new NextRequest(`http://localhost:3000/api/admin/inscricoes/${id}/avaliacao`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

const sampleNotas = [
  { criterio: 'Relevancia Cultural', nota: 8, peso: 25 },
  { criterio: 'Viabilidade Tecnica', nota: 7, peso: 25 },
  { criterio: 'Coerencia do Plano', nota: 9, peso: 20 },
  { criterio: 'Contrapartida Social', nota: 6, peso: 15 },
  { criterio: 'Historico do Proponente', nota: 8, peso: 15 },
]

const baseInscricao = {
  id: 'insc-1',
  numero: 'PNAB-2025-0001',
  status: 'EM_AVALIACAO',
  edital: { id: 'edital-1' },
  avaliacoes: [
    {
      id: 'aval-1',
      notas: sampleNotas,
      parecer: 'Projeto consistente',
      notaTotal: 7.65,
      finalizada: false,
      updatedAt: new Date('2025-03-01'),
    },
  ],
}

describe('GET /api/admin/inscricoes/[id]/avaliacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('AVALIADOR atribuido → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.avaliacao).toBeDefined()
    expect(body.criterios).toBeDefined()
    expect(body.inscricaoStatus).toBe('EM_AVALIACAO')
  })

  it('AVALIADOR nao atribuido → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-2', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      avaliacoes: [],
    } as never)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('FORBIDDEN')
  })

  it('ADMIN → 200 (sempre pode ver)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      avaliacoes: [],
    } as never)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.avaliacao).toBeNull()
    expect(body.criterios).toBeDefined()
  })

  it('inscricao nao encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('sem sessao → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('role PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(403)
  })
})

describe('PUT /api/admin/inscricoes/[id]/avaliacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('salvar rascunho → 200 + finalizada: false', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      numero: 'PNAB-2025-0001',
      status: 'EM_AVALIACAO',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(null)
    mockPrisma.avaliacao.upsert.mockResolvedValue({
      id: 'aval-1',
      notaTotal: 7.65,
      finalizada: false,
      updatedAt: new Date(),
    } as never)

    const res = await PUT(
      makePutRequest({ notas: sampleNotas, finalizar: false }),
      makeParams(),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.avaliacao.finalizada).toBe(false)
    expect(body.message).toContain('Rascunho')
  })

  it('finalizar → 200 + notaTotal calculada', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      numero: 'PNAB-2025-0001',
      status: 'EM_AVALIACAO',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(null)
    mockPrisma.avaliacao.upsert.mockResolvedValue({
      id: 'aval-1',
      notaTotal: 7.65,
      finalizada: true,
      updatedAt: new Date(),
    } as never)

    const res = await PUT(
      makePutRequest({ notas: sampleNotas, finalizar: true }),
      makeParams(),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.avaliacao.finalizada).toBe(true)
    expect(body.avaliacao.notaTotal).toBeDefined()
    expect(body.message).toContain('finalizada')
  })

  it('ja finalizada (nao ADMIN) → 422', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      numero: 'PNAB-2025-0001',
      status: 'EM_AVALIACAO',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue({
      id: 'aval-1',
      finalizada: true,
    } as never)

    const res = await PUT(
      makePutRequest({ notas: sampleNotas, finalizar: false }),
      makeParams(),
    )

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('LOCKED')
  })

  it('ADMIN pode alterar avaliacao finalizada', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      numero: 'PNAB-2025-0001',
      status: 'EM_AVALIACAO',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue({
      id: 'aval-1',
      finalizada: true,
    } as never)
    mockPrisma.avaliacao.upsert.mockResolvedValue({
      id: 'aval-1',
      notaTotal: 8.0,
      finalizada: true,
      updatedAt: new Date(),
    } as never)

    const res = await PUT(
      makePutRequest({ notas: sampleNotas, finalizar: true }),
      makeParams(),
    )

    expect(res.status).toBe(200)
  })

  it('sem sessao → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await PUT(
      makePutRequest({ notas: sampleNotas }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('inscricao nao encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)

    const res = await PUT(
      makePutRequest({ notas: sampleNotas }),
      makeParams(),
    )

    expect(res.status).toBe(404)
  })

  it('audit log registrado ao salvar avaliacao', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      numero: 'PNAB-2025-0001',
      status: 'EM_AVALIACAO',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(null)
    mockPrisma.avaliacao.upsert.mockResolvedValue({
      id: 'aval-1',
      notaTotal: 7.65,
      finalizada: false,
      updatedAt: new Date(),
    } as never)

    await PUT(
      makePutRequest({ notas: sampleNotas, finalizar: false }),
      makeParams(),
    )

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'aval-user-1',
        entity: 'Avaliacao',
        entityId: 'aval-1',
      }),
    )
  })
})
