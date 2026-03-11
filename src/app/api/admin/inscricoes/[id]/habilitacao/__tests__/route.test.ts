import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PUT } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { enqueueEmail } from '@/lib/queue'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockEnqueueEmail = vi.mocked(enqueueEmail)
const mockLogAudit = vi.mocked(logAudit)

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/inscricoes/insc-1/habilitacao', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

const baseInscricao = {
  id: 'insc-1',
  numero: 'INS-001',
  status: 'ENVIADA',
  proponente: { email: 'ana@test.com', nome: 'Ana' },
  edital: { titulo: 'Edital PNAB 2025' },
}

describe('PUT /api/admin/inscricoes/[id]/habilitacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.inscricao.update.mockResolvedValue({} as never)
    mockLogAudit.mockResolvedValue(undefined)
    mockEnqueueEmail.mockResolvedValue(undefined as never)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await PUT(makeRequest({ status: 'HABILITADA' }), makeParams())

    expect(res.status).toBe(403)
  })

  it('role PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)

    const res = await PUT(makeRequest({ status: 'HABILITADA' }), makeParams())

    expect(res.status).toBe(403)
  })

  it('role HABILITADOR → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'HABILITADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await PUT(makeRequest({ status: 'HABILITADA' }), makeParams())

    expect(res.status).toBe(200)
  })

  it('role ADMIN → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await PUT(makeRequest({ status: 'HABILITADA' }), makeParams())

    expect(res.status).toBe(200)
  })

  it('inscrição não encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)

    const res = await PUT(makeRequest({ status: 'HABILITADA' }), makeParams())

    expect(res.status).toBe(404)
  })

  it('INABILITADA sem motivo → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await PUT(makeRequest({ status: 'INABILITADA' }), makeParams())

    expect(res.status).toBe(400)
  })

  it('HABILITADA → atualiza status, motivo null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    await PUT(makeRequest({ status: 'HABILITADA' }), makeParams())

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'insc-1' },
      data: { status: 'HABILITADA', motivoInabilitacao: null },
    })
  })

  it('INABILITADA → atualiza status + motivo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    await PUT(makeRequest({ status: 'INABILITADA', motivo: 'Doc incompleta' }), makeParams())

    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'insc-1' },
      data: { status: 'INABILITADA', motivoInabilitacao: 'Doc incompleta' },
    })
  })

  it('email de habilitação enfileirado (GAP 3)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    await PUT(makeRequest({ status: 'HABILITADA' }), makeParams())

    expect(mockEnqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@test.com',
        template: 'habilitacao',
        data: expect.objectContaining({
          resultado: 'HABILITADA',
        }),
      }),
    )
  })

  it('audit log registrado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    await PUT(makeRequest({ status: 'HABILITADA' }), makeParams())

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'INSCRICAO_HABILITADA',
        entity: 'Inscricao',
        entityId: 'insc-1',
      }),
    )
  })
})
