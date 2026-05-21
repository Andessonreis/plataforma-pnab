import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT, DELETE } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

const BASE_URL = 'http://localhost:3000/api/admin/configuracoes/templates-avaliacao'

function makeRequest(method: string, body?: Record<string, unknown>) {
  return new NextRequest(`${BASE_URL}/t1`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  })
}

function ctx(id = 't1') {
  return { params: Promise.resolve({ id }) }
}

const EXISTING_TEMPLATE = {
  id: 't1',
  nome: 'Template Teste',
  descricao: 'Desc',
  criterios: [{ criterio: 'A', peso: 10, notaMax: 10 }],
  formula: null,
  isSystem: false,
  ativo: true,
  ordem: 10,
}

const SYSTEM_TEMPLATE = {
  ...EXISTING_TEMPLATE,
  id: 't2',
  nome: 'PNAB Cultura Viva',
  isSystem: true,
}

describe('GET /api/admin/configuracoes/templates-avaliacao/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(makeRequest('GET'), ctx())
    expect(res.status).toBe(403)
  })

  it('template não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(null as never)

    const res = await GET(makeRequest('GET'), ctx())
    expect(res.status).toBe(404)
  })

  it('ADMIN → 200 com template', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(EXISTING_TEMPLATE as never)

    const res = await GET(makeRequest('GET'), ctx())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.nome).toBe('Template Teste')
  })
})

describe('PUT /api/admin/configuracoes/templates-avaliacao/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await PUT(makeRequest('PUT', { nome: 'Novo' }), ctx())
    expect(res.status).toBe(403)
  })

  it('template não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(null as never)

    const res = await PUT(makeRequest('PUT', { descricao: 'Nova desc' }), ctx())
    expect(res.status).toBe(404)
  })

  it('atualiza template normal → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(EXISTING_TEMPLATE as never)
    mockPrisma.evaluationTemplate.findFirst.mockResolvedValue(null as never) // dup check
    mockPrisma.evaluationTemplate.update.mockResolvedValue({
      ...EXISTING_TEMPLATE,
      descricao: 'Nova desc',
    } as never)

    const res = await PUT(makeRequest('PUT', { descricao: 'Nova desc' }), ctx())
    expect(res.status).toBe(200)
  })

  it('isSystem → nome não é alterado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(SYSTEM_TEMPLATE as never)
    mockPrisma.evaluationTemplate.update.mockResolvedValue(SYSTEM_TEMPLATE as never)

    await PUT(makeRequest('PUT', { nome: 'Novo Nome', descricao: 'Nova desc' }), ctx('t2'))

    const updateCall = mockPrisma.evaluationTemplate.update.mock.calls[0][0]
    expect(updateCall.data).not.toHaveProperty('nome')
    expect(updateCall.data).toHaveProperty('descricao')
  })

  it('registra audit log', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(EXISTING_TEMPLATE as never)
    mockPrisma.evaluationTemplate.findFirst.mockResolvedValue(null as never)
    mockPrisma.evaluationTemplate.update.mockResolvedValue(EXISTING_TEMPLATE as never)

    await PUT(makeRequest('PUT', { descricao: 'Atualizado' }), ctx())

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TEMPLATE_AVALIACAO_ATUALIZADO',
        entity: 'EvaluationTemplate',
      }),
    )
  })
})

describe('DELETE /api/admin/configuracoes/templates-avaliacao/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await DELETE(makeRequest('DELETE'), ctx())
    expect(res.status).toBe(403)
  })

  it('template não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(null as never)

    const res = await DELETE(makeRequest('DELETE'), ctx())
    expect(res.status).toBe(404)
  })

  it('template normal → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(EXISTING_TEMPLATE as never)
    mockPrisma.evaluationTemplate.delete.mockResolvedValue(EXISTING_TEMPLATE as never)

    const res = await DELETE(makeRequest('DELETE'), ctx())
    expect(res.status).toBe(200)
  })

  it('isSystem → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(SYSTEM_TEMPLATE as never)

    const res = await DELETE(makeRequest('DELETE'), ctx('t2'))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.message).toContain('sistema')
  })

  it('registra audit log', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.evaluationTemplate.findUnique.mockResolvedValue(EXISTING_TEMPLATE as never)
    mockPrisma.evaluationTemplate.delete.mockResolvedValue(EXISTING_TEMPLATE as never)

    await DELETE(makeRequest('DELETE'), ctx())

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TEMPLATE_AVALIACAO_EXCLUIDO',
        entity: 'EvaluationTemplate',
      }),
    )
  })
})
