import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

const BASE_URL = 'http://localhost:3000/api/admin/configuracoes/templates-avaliacao'

function makeGetRequest(all?: boolean) {
  const url = all ? `${BASE_URL}?all=true` : BASE_URL
  return new NextRequest(url, { method: 'GET' })
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const VALID_CRITERIOS = [
  { criterio: 'Critério A', peso: 10, notaMax: 10, bloco: 'Bloco 1', modo: 'discreto' as const, naoAtende: 0, parcial: 5, plenamente: 10 },
  { criterio: 'Critério B', peso: 5, notaMax: 5, bloco: 'Bloco 2', modo: 'discreto' as const, naoAtende: 0, parcial: 2, plenamente: 5 },
]

describe('GET /api/admin/configuracoes/templates-avaliacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(403)
  })

  it('role não-ADMIN → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(403)
  })

  it('ADMIN → 200 com lista de templates', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findMany.mockResolvedValue([
      { id: 't1', nome: 'PNAB Cultura Viva', criterios: VALID_CRITERIOS, ativo: true },
    ] as never)

    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].nome).toBe('PNAB Cultura Viva')
  })

  it('filtra inativos por padrão', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findMany.mockResolvedValue([] as never)

    await GET(makeGetRequest())

    expect(mockPrisma.evaluationTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ativo: true } }),
    )
  })

  it('all=true inclui inativos', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findMany.mockResolvedValue([] as never)

    await GET(makeGetRequest(true))

    expect(mockPrisma.evaluationTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })
})

describe('POST /api/admin/configuracoes/templates-avaliacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await POST(makePostRequest({ nome: 'Teste', criterios: VALID_CRITERIOS }))
    expect(res.status).toBe(403)
  })

  it('campos faltando → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    const res = await POST(makePostRequest({ nome: '' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  it('critérios vazios → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    const res = await POST(makePostRequest({ nome: 'Teste', criterios: [] }))
    expect(res.status).toBe(400)
  })

  it('POST válido → 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findFirst.mockResolvedValueOnce(null as never) // nome check
    mockPrisma.evaluationTemplate.findFirst.mockResolvedValueOnce(null as never) // ordem check
    mockPrisma.evaluationTemplate.create.mockResolvedValue({
      id: 't1',
      nome: 'Template Teste',
      criterios: VALID_CRITERIOS,
    } as never)

    const res = await POST(makePostRequest({
      nome: 'Template Teste',
      criterios: VALID_CRITERIOS,
      formula: '((B1+B2)/2)+B3',
    }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('t1')
  })

  it('nome duplicado → 409', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findFirst.mockResolvedValue({ id: 'existing' } as never)

    const res = await POST(makePostRequest({
      nome: 'Existente',
      criterios: VALID_CRITERIOS,
    }))

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('CONFLICT')
  })

  it('registra audit log após criação', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findFirst.mockResolvedValueOnce(null as never)
    mockPrisma.evaluationTemplate.findFirst.mockResolvedValueOnce(null as never)
    mockPrisma.evaluationTemplate.create.mockResolvedValue({
      id: 't1',
      nome: 'Template Teste',
    } as never)

    await POST(makePostRequest({ nome: 'Template Teste', criterios: VALID_CRITERIOS }))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'TEMPLATE_AVALIACAO_CRIADO',
        entity: 'EvaluationTemplate',
        entityId: 't1',
      }),
    )
  })
})
