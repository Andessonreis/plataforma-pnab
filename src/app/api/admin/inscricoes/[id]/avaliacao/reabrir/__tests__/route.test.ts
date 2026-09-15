import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

function makeRequest(body: Record<string, unknown> = {}, id = 'insc-1') {
  return new NextRequest(`http://localhost:3000/api/admin/inscricoes/${id}/avaliacao/reabrir`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

const baseInscricao = {
  id: 'insc-1',
  numero: 'PNAB-2025-0001',
  editalId: 'edital-1',
  edital: { status: 'AVALIACAO' },
}

const avaliacaoFinalizada = {
  id: 'aval-1',
  notas: [{ criterio: 'Qualidade', nota: 5, peso: 100 }],
  parecer: 'Parecer anterior',
  notaTotal: 5,
  finalizada: true,
}

describe('POST /api/admin/inscricoes/[id]/avaliacao/reabrir', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('AVALIADOR dono reabre avaliacao finalizada → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(avaliacaoFinalizada as never)
    mockPrisma.avaliacao.update.mockResolvedValue({ ...avaliacaoFinalizada, finalizada: false } as never)

    const res = await POST(makeRequest({ motivo: 'Quero comparar com outras propostas' }), makeParams())

    expect(res.status).toBe(200)
    expect(mockPrisma.avaliacao.update).toHaveBeenCalledWith({
      where: { id: 'aval-1' },
      data: { finalizada: false },
    })
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'aval-user-1',
        action: 'AVALIACAO_REABERTA',
        entity: 'Avaliacao',
        entityId: 'aval-1',
        details: expect.objectContaining({
          notasAnteriores: avaliacaoFinalizada.notas,
          parecerAnterior: 'Parecer anterior',
          motivo: 'Quero comparar com outras propostas',
        }),
      }),
    )
  })

  it('motivo eh opcional → 200 sem motivo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(avaliacaoFinalizada as never)
    mockPrisma.avaliacao.update.mockResolvedValue({ ...avaliacaoFinalizada, finalizada: false } as never)

    const res = await POST(makeRequest({}), makeParams())

    expect(res.status).toBe(200)
  })

  it('avaliacao ainda nao finalizada → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue({ ...avaliacaoFinalizada, finalizada: false } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(400)
    expect(mockPrisma.avaliacao.update).not.toHaveBeenCalled()
  })

  it('resultado preliminar ja consolidado → 422 LOCKED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      edital: { status: 'RESULTADO_PRELIMINAR' },
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(avaliacaoFinalizada as never)
    mockPrisma.inscricao.count.mockResolvedValue(1)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('LOCKED')
    expect(mockPrisma.avaliacao.update).not.toHaveBeenCalled()
  })

  it('status pos-avaliacao mas sem nota consolidada ainda → permite reabrir', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      edital: { status: 'RESULTADO_PRELIMINAR' },
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(avaliacaoFinalizada as never)
    mockPrisma.inscricao.count.mockResolvedValue(0)
    mockPrisma.avaliacao.update.mockResolvedValue({ ...avaliacaoFinalizada, finalizada: false } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(200)
  })

  it('avaliacao nao encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'aval-user-1', role: 'AVALIADOR' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(null)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('ADMIN nao pode reabrir avaliacao de terceiro por esta rota → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
    expect(mockPrisma.avaliacao.findUnique).not.toHaveBeenCalled()
  })

  it('sem sessao → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
  })
})
