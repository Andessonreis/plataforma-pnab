import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, DELETE } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

function makePostRequest(body: Record<string, unknown>, id = 'insc-1') {
  return new NextRequest(`http://localhost:3000/api/admin/inscricoes/${id}/avaliacao/assign`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeDeleteRequest(body: Record<string, unknown>, id = 'insc-1') {
  return new NextRequest(`http://localhost:3000/api/admin/inscricoes/${id}/avaliacao/assign`, {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/admin/inscricoes/[id]/avaliacao/assign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)

    // O $transaction recebe uma callback e a executa com um proxy vazio.
    // As chamadas internas (tx.inscricao, tx.user, etc.) precisam
    // ser mockadas no objeto retornado pelo $transaction.
    // Como o setup.ts retorna ops({}), os testes do assign verificam
    // apenas o status code retornado (a logica interna roda com {}).
    // Para testar o happy path, precisamos fazer o $transaction retornar o resultado esperado.
    mockPrisma.$transaction.mockImplementation(async (fn: unknown) => {
      if (typeof fn === 'function') {
        return fn({
          inscricao: {
            findUnique: mockPrisma.inscricao.findUnique,
            update: mockPrisma.inscricao.update,
          },
          user: {
            findMany: mockPrisma.user.findMany,
          },
          avaliacao: {
            findMany: mockPrisma.avaliacao.findMany,
            findUnique: mockPrisma.avaliacao.findUnique,
            createMany: mockPrisma.avaliacao.createMany,
            delete: mockPrisma.avaliacao.delete,
            count: mockPrisma.avaliacao.count,
          },
        })
      }
      return Promise.all(fn as Promise<unknown>[])
    })
  })

  it('atribui avaliador → 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      status: 'HABILITADA',
      numero: 'PNAB-2025-0001',
    } as never)
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'aval-1', nome: 'Avaliador 1' },
    ] as never)
    mockPrisma.avaliacao.findMany.mockResolvedValue([] as never)
    mockPrisma.avaliacao.createMany.mockResolvedValue({ count: 1 } as never)
    mockPrisma.inscricao.update.mockResolvedValue({} as never)

    const res = await POST(
      makePostRequest({ avaliadorIds: ['aval-1'] }),
      makeParams(),
    )

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.created).toBe(1)
  })

  it('inscricao INABILITADA → 422', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      status: 'INABILITADA',
      numero: 'PNAB-2025-0001',
    } as never)

    const res = await POST(
      makePostRequest({ avaliadorIds: ['aval-1'] }),
      makeParams(),
    )

    expect(res.status).toBe(422)
  })

  it('inscricao ENVIADA → 422', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      status: 'ENVIADA',
      numero: 'PNAB-2025-0001',
    } as never)

    const res = await POST(
      makePostRequest({ avaliadorIds: ['aval-1'] }),
      makeParams(),
    )

    expect(res.status).toBe(422)
  })

  it('sem sessao → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(
      makePostRequest({ avaliadorIds: ['aval-1'] }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('role PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)

    const res = await POST(
      makePostRequest({ avaliadorIds: ['aval-1'] }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('inscricao nao encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)

    const res = await POST(
      makePostRequest({ avaliadorIds: ['aval-1'] }),
      makeParams(),
    )

    expect(res.status).toBe(404)
  })

  it('audit log registrado ao atribuir', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      status: 'HABILITADA',
      numero: 'PNAB-2025-0001',
    } as never)
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'aval-1', nome: 'Avaliador 1' },
    ] as never)
    mockPrisma.avaliacao.findMany.mockResolvedValue([] as never)
    mockPrisma.avaliacao.createMany.mockResolvedValue({ count: 1 } as never)
    mockPrisma.inscricao.update.mockResolvedValue({} as never)

    await POST(
      makePostRequest({ avaliadorIds: ['aval-1'] }),
      makeParams(),
    )

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'AVALIADOR_ATRIBUIDO',
        entity: 'Inscricao',
        entityId: 'insc-1',
      }),
    )
  })
})

describe('DELETE /api/admin/inscricoes/[id]/avaliacao/assign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)

    mockPrisma.$transaction.mockImplementation(async (fn: unknown) => {
      if (typeof fn === 'function') {
        return fn({
          inscricao: {
            findUnique: mockPrisma.inscricao.findUnique,
            update: mockPrisma.inscricao.update,
          },
          avaliacao: {
            findUnique: mockPrisma.avaliacao.findUnique,
            delete: mockPrisma.avaliacao.delete,
            count: mockPrisma.avaliacao.count,
          },
        })
      }
      return Promise.all(fn as Promise<unknown>[])
    })
  })

  it('remove avaliador → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      status: 'EM_AVALIACAO',
      numero: 'PNAB-2025-0001',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue({
      id: 'aval-1',
      finalizada: false,
    } as never)
    mockPrisma.avaliacao.delete.mockResolvedValue({} as never)
    mockPrisma.avaliacao.count.mockResolvedValue(1)

    const res = await DELETE(
      makeDeleteRequest({ avaliadorId: 'aval-user-1' }),
      makeParams(),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toContain('removido')
  })

  it('avaliacao finalizada → 422', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      status: 'EM_AVALIACAO',
      numero: 'PNAB-2025-0001',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue({
      id: 'aval-1',
      finalizada: true,
    } as never)

    const res = await DELETE(
      makeDeleteRequest({ avaliadorId: 'aval-user-1' }),
      makeParams(),
    )

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('LOCKED')
  })

  it('sem sessao → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await DELETE(
      makeDeleteRequest({ avaliadorId: 'aval-user-1' }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('role PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)

    const res = await DELETE(
      makeDeleteRequest({ avaliadorId: 'aval-user-1' }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('avaliacao nao encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      status: 'EM_AVALIACAO',
      numero: 'PNAB-2025-0001',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(null)

    const res = await DELETE(
      makeDeleteRequest({ avaliadorId: 'aval-user-1' }),
      makeParams(),
    )

    expect(res.status).toBe(404)
  })

  it('audit log registrado ao remover', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1',
      status: 'EM_AVALIACAO',
      numero: 'PNAB-2025-0001',
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue({
      id: 'aval-1',
      finalizada: false,
    } as never)
    mockPrisma.avaliacao.delete.mockResolvedValue({} as never)
    mockPrisma.avaliacao.count.mockResolvedValue(1)

    await DELETE(
      makeDeleteRequest({ avaliadorId: 'aval-user-1' }),
      makeParams(),
    )

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'AVALIADOR_REMOVIDO',
        entity: 'Inscricao',
        entityId: 'insc-1',
      }),
    )
  })
})
