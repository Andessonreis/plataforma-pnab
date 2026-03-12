import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/admin/tickets')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

const mockTickets = [
  {
    id: 'tk-1',
    assunto: 'Dúvida sobre inscrição',
    status: 'ABERTO',
    autor: { nome: 'João', email: 'joao@test.com' },
    createdAt: new Date(),
  },
]

describe('GET /api/admin/tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ADMIN → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.ticket.findMany.mockResolvedValue(mockTickets as never)
    mockPrisma.ticket.count.mockResolvedValue(1 as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.meta).toEqual(
      expect.objectContaining({ page: 1, total: 1, totalPages: 1 }),
    )
  })

  it('ATENDIMENTO → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'ATENDIMENTO' } } as never)
    mockPrisma.ticket.findMany.mockResolvedValue([] as never)
    mockPrisma.ticket.count.mockResolvedValue(0 as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
  })

  it('PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u3', role: 'PROPONENTE' } } as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
  })

  it('filtro status → where correto', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.ticket.findMany.mockResolvedValue([] as never)
    mockPrisma.ticket.count.mockResolvedValue(0 as never)

    await GET(makeGetRequest({ status: 'EM_ATENDIMENTO' }))

    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'EM_ATENDIMENTO' },
      }),
    )
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
  })

  it('paginação → skip/take corretos', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.ticket.findMany.mockResolvedValue([] as never)
    mockPrisma.ticket.count.mockResolvedValue(30 as never)

    await GET(makeGetRequest({ page: '2', pageSize: '10' }))

    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    )
  })
})
