import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function makeGetRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/admin/logs')
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

const mockLogs = [
  {
    id: 'log-1',
    action: 'EDITAL_CRIADO',
    entity: 'Edital',
    entityId: 'ed-1',
    userId: 'u1',
    createdAt: new Date('2025-01-15'),
    user: { id: 'u1', nome: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
  },
  {
    id: 'log-2',
    action: 'INSCRICAO_ENVIADA',
    entity: 'Inscricao',
    entityId: 'ins-1',
    userId: 'u2',
    createdAt: new Date('2025-01-16'),
    user: { id: 'u2', nome: 'Prop', email: 'prop@test.com', role: 'PROPONENTE' },
  },
]

describe('GET /api/admin/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ADMIN → 200 + paginacao', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs as never)
    mockPrisma.auditLog.count.mockResolvedValue(2 as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta).toBeDefined()
    expect(body.meta.total).toBe(2)
    expect(body.meta.page).toBe(1)
    expect(body.meta.totalPages).toBe(1)
  })

  it('filtro action → where inclui action', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.auditLog.findMany.mockResolvedValue([] as never)
    mockPrisma.auditLog.count.mockResolvedValue(0 as never)

    await GET(makeGetRequest({ action: 'EDITAL_CRIADO' }))

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: 'EDITAL_CRIADO' }),
      }),
    )
  })

  it('filtro dateFrom/dateTo → where inclui createdAt', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.auditLog.findMany.mockResolvedValue([] as never)
    mockPrisma.auditLog.count.mockResolvedValue(0 as never)

    await GET(makeGetRequest({ dateFrom: '2025-01-01', dateTo: '2025-12-31' }))

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    )
  })

  it('filtro entity → where inclui entity', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.auditLog.findMany.mockResolvedValue([] as never)
    mockPrisma.auditLog.count.mockResolvedValue(0 as never)

    await GET(makeGetRequest({ entity: 'Edital' }))

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entity: 'Edital' }),
      }),
    )
  })

  it('retorna filters com actions e entities distintas', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.auditLog.findMany
      .mockResolvedValueOnce(mockLogs as never) // dados
      .mockResolvedValueOnce([{ action: 'EDITAL_CRIADO' }, { action: 'INSCRICAO_ENVIADA' }] as never) // distinct actions
      .mockResolvedValueOnce([{ entity: 'Edital' }, { entity: 'Inscricao' }] as never) // distinct entities
    mockPrisma.auditLog.count.mockResolvedValue(2 as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.filters).toBeDefined()
    expect(body.filters.actions).toEqual(['EDITAL_CRIADO', 'INSCRICAO_ENVIADA'])
    expect(body.filters.entities).toEqual(['Edital', 'Inscricao'])
  })

  it('PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'PROPONENTE' } } as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
    expect(mockPrisma.auditLog.findMany).not.toHaveBeenCalled()
  })

  it('sem sessao → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
    expect(mockPrisma.auditLog.findMany).not.toHaveBeenCalled()
  })

  it('paginacao personalizada → page=2, pageSize=5', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.auditLog.findMany.mockResolvedValue([] as never)
    mockPrisma.auditLog.count.mockResolvedValue(15 as never)

    const res = await GET(makeGetRequest({ page: '2', pageSize: '5' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.meta.page).toBe(2)
    expect(body.meta.pageSize).toBe(5)
    expect(body.meta.totalPages).toBe(3)

    // Verifica skip/take
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      }),
    )
  })
})
