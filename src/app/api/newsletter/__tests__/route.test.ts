import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

const mockPrisma = vi.mocked(prisma)
const mockRateLimit = vi.mocked(rateLimit)

const validBody = {
  nome: 'Joao Santos',
  email: 'joao@example.com',
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/newsletter', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockResolvedValue(null as never)
  })

  it('email novo → 201', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null)
    mockPrisma.newsletterSubscriber.create.mockResolvedValue({
      id: 'sub-1',
      nome: validBody.nome,
      email: validBody.email,
      ativo: true,
    } as never)

    const res = await POST(makePostRequest(validBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toContain('sucesso')
    expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: { nome: validBody.nome, email: validBody.email },
    })
  })

  it('email existente ativo → 201 sem revelar existencia', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      id: 'sub-existing',
      nome: 'Joao',
      email: validBody.email,
      ativo: true,
    } as never)

    const res = await POST(makePostRequest(validBody))

    // Retorna 201 (sucesso generico) — nao revela que ja existia
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toContain('sucesso')
    // Nao deve criar nem atualizar
    expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled()
    expect(mockPrisma.newsletterSubscriber.update).not.toHaveBeenCalled()
  })

  it('email inativo → reativa (update called)', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      id: 'sub-inactive',
      nome: 'Joao Antigo',
      email: validBody.email,
      ativo: false,
    } as never)
    mockPrisma.newsletterSubscriber.update.mockResolvedValue({
      id: 'sub-inactive',
      nome: validBody.nome,
      email: validBody.email,
      ativo: true,
    } as never)

    const res = await POST(makePostRequest(validBody))

    expect(res.status).toBe(201)
    expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
      where: { email: validBody.email },
      data: { ativo: true, nome: validBody.nome },
    })
    expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled()
  })

  it('email invalido → 400', async () => {
    const res = await POST(makePostRequest({ nome: 'Joao', email: 'nao-e-email' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  it('nome curto → 400', async () => {
    const res = await POST(makePostRequest({ nome: 'J', email: 'joao@example.com' }))

    expect(res.status).toBe(400)
  })

  it('campos faltando → 400', async () => {
    const res = await POST(makePostRequest({ nome: 'Joao' }))

    expect(res.status).toBe(400)
  })

  it('rate limit acionado → retorna resposta do rate limit', async () => {
    const rateLimitResponse = new Response(
      JSON.stringify({ error: 'RATE_LIMIT', message: 'Muitas tentativas' }),
      { status: 429 },
    )
    mockRateLimit.mockResolvedValue(rateLimitResponse as never)

    const res = await POST(makePostRequest(validBody))

    expect(res.status).toBe(429)
    expect(mockPrisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled()
  })
})
