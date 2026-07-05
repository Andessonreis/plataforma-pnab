import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

const mockPrisma = vi.mocked(prisma)
const mockAuth = vi.mocked(auth)
const mockLogAudit = vi.mocked(logAudit)

const adminSession = { user: { id: 'admin-1', role: 'ADMIN' } }

function makeRequest(id: string, body: Record<string, unknown>) {
  const req = new NextRequest(`http://localhost:3000/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
  return { req, ctx: { params: Promise.resolve({ id }) } }
}

describe('PATCH /api/admin/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(adminSession as never)
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('não autenticado → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const { req, ctx } = makeRequest('user-2', { role: 'AVALIADOR' })
    const res = await PATCH(req, ctx)

    expect(res.status).toBe(403)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('role não-ADMIN → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'HABILITADOR' } } as never)

    const { req, ctx } = makeRequest('user-2', { role: 'AVALIADOR' })
    const res = await PATCH(req, ctx)

    expect(res.status).toBe(403)
  })

  it('alterar o próprio perfil → 400 SELF_FORBIDDEN', async () => {
    const { req, ctx } = makeRequest('admin-1', { role: 'PROPONENTE' })
    const res = await PATCH(req, ctx)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('SELF_FORBIDDEN')
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('role inválida → 400 VALIDATION_ERROR', async () => {
    const { req, ctx } = makeRequest('user-2', { role: 'SUPERUSER' })
    const res = await PATCH(req, ctx)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('VALIDATION_ERROR')
  })

  it('usuário não encontrado → 404', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const { req, ctx } = makeRequest('inexistente', { role: 'AVALIADOR' })
    const res = await PATCH(req, ctx)

    expect(res.status).toBe(404)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('alteração válida → 200 + update + audit com de/para', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2', role: 'PROPONENTE' } as never)
    mockPrisma.user.update.mockResolvedValue({ id: 'user-2', role: 'AVALIADOR' } as never)

    const { req, ctx } = makeRequest('user-2', { role: 'AVALIADOR' })
    const res = await PATCH(req, ctx)

    expect(res.status).toBe(200)
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { role: 'AVALIADOR' },
    })
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'USUARIO_ROLE_ALTERADA',
        entity: 'User',
        entityId: 'user-2',
        details: { de: 'PROPONENTE', para: 'AVALIADOR' },
      }),
    )
  })

  it('mesma role → 200 sem update nem audit', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2', role: 'AVALIADOR' } as never)

    const { req, ctx } = makeRequest('user-2', { role: 'AVALIADOR' })
    const res = await PATCH(req, ctx)

    expect(res.status).toBe(200)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })
})
