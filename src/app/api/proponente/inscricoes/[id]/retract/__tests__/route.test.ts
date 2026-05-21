import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/proponente/inscricoes/insc-1/retract', {
    method: 'POST',
  })
}

function makeParams(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

const baseInscricao = {
  id: 'insc-1',
  proponenteId: 'user-1',
  editalId: 'edital-1',
  status: 'ENVIADA',
  edital: {
    id: 'edital-1',
    status: 'INSCRICOES_ABERTAS',
  },
}

describe('POST /api/proponente/inscricoes/[id]/retract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.inscricao.update.mockResolvedValue({ id: 'insc-1', status: 'RASCUNHO' } as never)
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('role !== PROPONENTE → 401', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('inscrição não encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('inscrição de outro proponente → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'other-user', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('status !== ENVIADA → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({ ...baseInscricao, status: 'RASCUNHO' } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.message).toContain('enviadas')
  })

  it('edital não INSCRICOES_ABERTAS → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      edital: { ...baseInscricao.edital, status: 'INSCRICOES_ENCERRADAS' },
    } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.message).toContain('prazo')
  })

  it('retract válido → 200, status RASCUNHO', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('RASCUNHO')
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'insc-1' },
        data: { status: 'RASCUNHO' },
      }),
    )
  })

  it('audit log registrado com INSCRICAO_RETIRADA', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    await POST(makeRequest(), makeParams())

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'INSCRICAO_RETIRADA',
        entity: 'Inscricao',
        entityId: 'insc-1',
      }),
    )
  })
})
