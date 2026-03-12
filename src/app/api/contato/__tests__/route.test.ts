import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

const mockPrisma = vi.mocked(prisma)
const mockRateLimit = vi.mocked(rateLimit)

const validContatoBody = {
  nomeContato: 'Maria Silva',
  emailContato: 'maria@example.com',
  assunto: 'Duvida sobre edital',
  mensagem: 'Gostaria de saber mais informacoes sobre o edital de audiovisual.',
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/contato', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/contato', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockResolvedValue(null as never)
  })

  it('dados validos → 201 + protocolo', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null)
    mockPrisma.ticket.create.mockResolvedValue({
      id: 'ticket-1',
      protocolo: 'PNAB-2025-ABC123',
      status: 'ABERTO',
    } as never)

    const res = await POST(makePostRequest(validContatoBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.protocolo).toBeDefined()
    expect(body.protocolo).toMatch(/^PNAB-\d{4}-[A-Z0-9]{6}$/)
    expect(body.message).toContain('sucesso')
  })

  it('protocolo retornado no body', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null)
    mockPrisma.ticket.create.mockResolvedValue({
      id: 'ticket-2',
      protocolo: 'PNAB-2025-XYZ789',
      status: 'ABERTO',
    } as never)

    const res = await POST(makePostRequest(validContatoBody))
    const body = await res.json()

    expect(body.protocolo).toBeDefined()
    expect(typeof body.protocolo).toBe('string')
  })

  it('ticket criado com status ABERTO', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null)
    mockPrisma.ticket.create.mockResolvedValue({
      id: 'ticket-3',
      protocolo: 'PNAB-2025-DEF456',
      status: 'ABERTO',
    } as never)

    await POST(makePostRequest(validContatoBody))

    expect(mockPrisma.ticket.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'ABERTO',
        nomeContato: validContatoBody.nomeContato,
        emailContato: validContatoBody.emailContato,
        assunto: validContatoBody.assunto,
        mensagem: validContatoBody.mensagem,
      }),
    })
  })

  it('editalId inexistente → 404', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null)
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    const res = await POST(
      makePostRequest({ ...validContatoBody, editalId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' }),
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('NOT_FOUND')
    expect(mockPrisma.ticket.create).not.toHaveBeenCalled()
  })

  it('editalId valido → 201', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null)
    mockPrisma.edital.findUnique.mockResolvedValue({ id: 'ed-1' } as never)
    mockPrisma.ticket.create.mockResolvedValue({
      id: 'ticket-4',
      protocolo: 'PNAB-2025-GHI012',
      status: 'ABERTO',
    } as never)

    const res = await POST(
      makePostRequest({ ...validContatoBody, editalId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' }),
    )

    expect(res.status).toBe(201)
  })

  it('campos faltando → 400', async () => {
    const res = await POST(makePostRequest({ nomeContato: 'Maria' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  it('email invalido → 400', async () => {
    const res = await POST(
      makePostRequest({ ...validContatoBody, emailContato: 'nao-e-email' }),
    )

    expect(res.status).toBe(400)
  })

  it('mensagem curta → 400', async () => {
    const res = await POST(
      makePostRequest({ ...validContatoBody, mensagem: 'curta' }),
    )

    expect(res.status).toBe(400)
  })

  it('rate limit acionado → retorna resposta do rate limit', async () => {
    const rateLimitResponse = new Response(
      JSON.stringify({ error: 'RATE_LIMIT', message: 'Muitas tentativas' }),
      { status: 429 },
    )
    mockRateLimit.mockResolvedValue(rateLimitResponse as never)

    const res = await POST(makePostRequest(validContatoBody))

    expect(res.status).toBe(429)
    expect(mockPrisma.ticket.create).not.toHaveBeenCalled()
  })
})
