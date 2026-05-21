import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

function makeReq(body: Record<string, unknown>, id = 'ed-1') {
  return new NextRequest(`http://localhost:3000/api/admin/editais/${id}/avancar-fase`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function params(id = 'ed-1') {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/admin/editais/[id]/avancar-fase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await POST(
      makeReq({ proximoStatus: 'PUBLICADO', justificativa: 'motivo válido com tamanho' }),
      params(),
    )
    expect(res.status).toBe(403)
  })

  it('PROPONENTE → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    const res = await POST(
      makeReq({ proximoStatus: 'PUBLICADO', justificativa: 'motivo válido com tamanho' }),
      params(),
    )
    expect(res.status).toBe(403)
  })

  it('justificativa < 10 chars → 400 VALIDATION_ERROR', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    const res = await POST(
      makeReq({ proximoStatus: 'PUBLICADO', justificativa: 'curta' }),
      params(),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  it('proximoStatus inválido → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    const res = await POST(
      makeReq({ proximoStatus: 'STATUS_INEXISTENTE', justificativa: 'motivo válido com tamanho' }),
      params(),
    )
    expect(res.status).toBe(400)
  })

  it('edital não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)
    const res = await POST(
      makeReq({ proximoStatus: 'PUBLICADO', justificativa: 'motivo válido com tamanho' }),
      params(),
    )
    expect(res.status).toBe(404)
  })

  it('mesma fase do atual → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      status: 'PUBLICADO',
      titulo: 'X',
      publishedAt: new Date('2026-01-01'),
    } as never)
    const res = await POST(
      makeReq({ proximoStatus: 'PUBLICADO', justificativa: 'motivo válido com tamanho' }),
      params(),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/já está/i)
  })

  it('avança fase → 200 + audit log com origem manual', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      status: 'INSCRICOES_ABERTAS',
      titulo: 'Edital X',
      publishedAt: new Date('2026-01-01'),
    } as never)
    mockPrisma.edital.update.mockResolvedValue({} as never)

    const res = await POST(
      makeReq({ proximoStatus: 'INSCRICOES_ENCERRADAS', justificativa: 'encerramento antecipado por decisão administrativa' }),
      params(),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.statusAnterior).toBe('INSCRICOES_ABERTAS')
    expect(body.novoStatus).toBe('INSCRICOES_ENCERRADAS')
    expect(body.retrocesso).toBe(false)

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: { status: 'INSCRICOES_ENCERRADAS' },
    })

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'EDITAL_FASE_AVANCADA_MANUAL',
        entity: 'Edital',
        entityId: 'ed-1',
        details: expect.objectContaining({
          statusAnterior: 'INSCRICOES_ABERTAS',
          novoStatus: 'INSCRICOES_ENCERRADAS',
          justificativa: 'encerramento antecipado por decisão administrativa',
          retrocesso: false,
        }),
      }),
    )
  })

  it('retroceder fase → 200 + retrocesso: true', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      status: 'AVALIACAO',
      titulo: 'Edital X',
      publishedAt: new Date('2026-01-01'),
    } as never)
    mockPrisma.edital.update.mockResolvedValue({} as never)

    const res = await POST(
      makeReq({ proximoStatus: 'HABILITACAO', justificativa: 'reabrir habilitação por decisão judicial' }),
      params(),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.retrocesso).toBe(true)

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          retrocesso: true,
        }),
      }),
    )
  })

  it('sair de RASCUNHO pela primeira vez → preenche publishedAt', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      status: 'RASCUNHO',
      titulo: 'Edital X',
      publishedAt: null,
    } as never)
    mockPrisma.edital.update.mockResolvedValue({} as never)

    await POST(
      makeReq({ proximoStatus: 'PUBLICADO', justificativa: 'publicar edital agora mesmo' }),
      params(),
    )

    const updateCall = mockPrisma.edital.update.mock.calls[0][0]
    expect(updateCall.data).toMatchObject({ status: 'PUBLICADO' })
    expect((updateCall.data as { publishedAt?: Date }).publishedAt).toBeInstanceOf(Date)
  })

  it('sair de RASCUNHO mas já publicado antes → não sobrescreve publishedAt', async () => {
    const original = new Date('2026-01-01')
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      status: 'RASCUNHO',
      titulo: 'Edital X',
      publishedAt: original,
    } as never)
    mockPrisma.edital.update.mockResolvedValue({} as never)

    await POST(
      makeReq({ proximoStatus: 'PUBLICADO', justificativa: 'reabrir publicação' }),
      params(),
    )

    const updateCall = mockPrisma.edital.update.mock.calls[0][0]
    expect((updateCall.data as { publishedAt?: Date }).publishedAt).toBeUndefined()
  })
})
