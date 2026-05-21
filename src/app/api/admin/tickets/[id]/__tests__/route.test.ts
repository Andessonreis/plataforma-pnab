import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function makePatchRequest(body: Record<string, unknown>, id = 'tk-1') {
  return new NextRequest(`http://localhost:3000/api/admin/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'tk-1') {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/admin/tickets/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'u1', name: 'Atendente Maria', role: 'ATENDIMENTO' } } as never)
  })

  it('regressão #70 — resposta em ABERTO progride para EM_ATENDIMENTO', async () => {
    mockPrisma.atendimento.findUnique.mockResolvedValue({
      id: 'tk-1',
      status: 'ABERTO',
      historico: [],
    } as never)
    mockPrisma.atendimento.update.mockResolvedValue({} as never)

    const res = await PATCH(
      makePatchRequest({ resposta: { texto: 'Olá Maria, vamos te ajudar.' } }),
      makeParams(),
    )

    expect(res.status).toBe(200)
    expect(mockPrisma.atendimento.update).toHaveBeenCalledWith({
      where: { id: 'tk-1' },
      data: expect.objectContaining({
        status: 'EM_ATENDIMENTO',
        historico: expect.any(Array),
      }),
    })
  })

  it('resposta em EM_ATENDIMENTO mantém status (não retrocede)', async () => {
    mockPrisma.atendimento.findUnique.mockResolvedValue({
      id: 'tk-1',
      status: 'EM_ATENDIMENTO',
      historico: [],
    } as never)
    mockPrisma.atendimento.update.mockResolvedValue({} as never)

    await PATCH(
      makePatchRequest({ resposta: { texto: 'Atualizando o caso...' } }),
      makeParams(),
    )

    const updateCall = mockPrisma.atendimento.update.mock.calls[0][0]
    // Não deve forçar mudança de status quando já está EM_ATENDIMENTO
    expect(updateCall.data.status).toBeUndefined()
  })

  it('status explícito FECHADO sobrescreve auto-progressão', async () => {
    mockPrisma.atendimento.findUnique.mockResolvedValue({
      id: 'tk-1',
      status: 'ABERTO',
      historico: [],
    } as never)
    mockPrisma.atendimento.update.mockResolvedValue({} as never)

    await PATCH(
      makePatchRequest({
        resposta: { texto: 'Resolvido. Encerrando.' },
        status: 'FECHADO',
      }),
      makeParams(),
    )

    expect(mockPrisma.atendimento.update).toHaveBeenCalledWith({
      where: { id: 'tk-1' },
      data: expect.objectContaining({ status: 'FECHADO' }),
    })
  })

  it('sem resposta + status apenas → atualiza status', async () => {
    mockPrisma.atendimento.findUnique.mockResolvedValue({
      id: 'tk-1',
      status: 'ABERTO',
      historico: [],
    } as never)
    mockPrisma.atendimento.update.mockResolvedValue({} as never)

    await PATCH(
      makePatchRequest({ status: 'EM_ATENDIMENTO' }),
      makeParams(),
    )

    expect(mockPrisma.atendimento.update).toHaveBeenCalledWith({
      where: { id: 'tk-1' },
      data: { status: 'EM_ATENDIMENTO' },
    })
  })

  it('histórico acumula (não substitui)', async () => {
    mockPrisma.atendimento.findUnique.mockResolvedValue({
      id: 'tk-1',
      status: 'EM_ATENDIMENTO',
      historico: [{ de: 'Maria', texto: 'Pergunta inicial', criadoEm: '2026-04-01T10:00:00Z' }],
    } as never)
    mockPrisma.atendimento.update.mockResolvedValue({} as never)

    await PATCH(
      makePatchRequest({ resposta: { texto: 'Resposta agora.' } }),
      makeParams(),
    )

    const updateCall = mockPrisma.atendimento.update.mock.calls[0][0]
    expect(updateCall.data.historico).toHaveLength(2)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await PATCH(
      makePatchRequest({ resposta: { texto: 'olá olá' } }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u9', role: 'PROPONENTE' } } as never)

    const res = await PATCH(
      makePatchRequest({ resposta: { texto: 'olá olá' } }),
      makeParams(),
    )

    expect(res.status).toBe(403)
  })

  it('ticket não encontrado → 404', async () => {
    mockPrisma.atendimento.findUnique.mockResolvedValue(null)

    const res = await PATCH(
      makePatchRequest({ resposta: { texto: 'olá olá' } }),
      makeParams(),
    )

    expect(res.status).toBe(404)
  })

  it('resposta curta < 5 chars → 400', async () => {
    mockPrisma.atendimento.findUnique.mockResolvedValue({
      id: 'tk-1',
      status: 'ABERTO',
      historico: [],
    } as never)

    const res = await PATCH(
      makePatchRequest({ resposta: { texto: 'oi' } }),
      makeParams(),
    )

    expect(res.status).toBe(400)
  })
})
