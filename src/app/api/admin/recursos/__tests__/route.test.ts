import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/admin/recursos')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

const mockRecursos = [
  {
    id: 'rec-1',
    fase: 'HABILITACAO',
    justificativa: 'Discordo da inabilitação',
    decisao: null,
    inscricao: {
      proponente: { nome: 'Ana', cpfCnpj: '12345678901' },
      edital: { titulo: 'Edital PNAB 2025' },
    },
    createdAt: new Date(),
  },
]

describe('GET /api/admin/recursos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ADMIN → 200 + paginação', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.recurso.findMany.mockResolvedValue(mockRecursos as never)
    mockPrisma.recurso.count.mockResolvedValue(1 as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.meta).toEqual(
      expect.objectContaining({ page: 1, total: 1, totalPages: 1 }),
    )
  })

  it('HABILITADOR → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'HABILITADOR' } } as never)
    mockPrisma.recurso.findMany.mockResolvedValue([] as never)
    mockPrisma.recurso.count.mockResolvedValue(0 as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
  })

  it('PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u3', role: 'PROPONENTE' } } as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
  })

  it('filtro fase → where inclui fase', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.recurso.findMany.mockResolvedValue([] as never)
    mockPrisma.recurso.count.mockResolvedValue(0 as never)

    await GET(makeGetRequest({ fase: 'HABILITACAO' }))

    expect(mockPrisma.recurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ fase: 'HABILITACAO' }),
      }),
    )
  })

  it('filtro pendente=true → where decisao: null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.recurso.findMany.mockResolvedValue([] as never)
    mockPrisma.recurso.count.mockResolvedValue(0 as never)

    await GET(makeGetRequest({ pendente: 'true' }))

    expect(mockPrisma.recurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ decisao: null }),
      }),
    )
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(403)
  })
})
