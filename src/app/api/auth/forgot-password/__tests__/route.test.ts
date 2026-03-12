import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/mail'

const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)
const mockRateLimit = vi.mocked(rateLimit)
const mockSendEmail = vi.mocked(sendEmail)

const existingUser = {
  id: 'user-1',
  nome: 'Maria Silva',
  cpfCnpj: '12345678901',
  email: 'maria@example.com',
  ativo: true,
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
    mockRateLimit.mockResolvedValue(null as never)
    mockSendEmail.mockResolvedValue(undefined as never)
  })

  it('CPF existente → 200 + token criado', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(existingUser as never)
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 } as never)
    mockPrisma.passwordResetToken.create.mockResolvedValue({
      id: 'token-1',
      token: 'abc123',
      userId: existingUser.id,
    } as never)

    const res = await POST(makeRequest({ cpfCnpj: '12345678901' }))

    expect(res.status).toBe(200)
    expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: existingUser.id,
      }),
    })
  })

  it('CPF inexistente → 200 (sem token criado)', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)

    const res = await POST(makeRequest({ cpfCnpj: '99999999999' }))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBeDefined()
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled()
  })

  it('email existente → 200 + sendEmail chamado', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(existingUser as never)
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 } as never)
    mockPrisma.passwordResetToken.create.mockResolvedValue({
      id: 'token-1',
      token: 'abc123',
      userId: existingUser.id,
    } as never)

    const res = await POST(makeRequest({ email: 'maria@example.com' }))

    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: existingUser.email,
        template: 'recuperacao_senha',
      }),
    )
  })

  it('sem CPF nem email → 400 VALIDATION_ERROR', async () => {
    const res = await POST(makeRequest({}))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('VALIDATION_ERROR')
  })

  it('tokens anteriores invalidados antes de criar novo', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(existingUser as never)
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 2 } as never)
    mockPrisma.passwordResetToken.create.mockResolvedValue({
      id: 'token-new',
      token: 'newtoken',
      userId: existingUser.id,
    } as never)

    await POST(makeRequest({ cpfCnpj: '12345678901' }))

    // updateMany deve ser chamado ANTES de create
    expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: existingUser.id,
        usedAt: null,
      },
      data: {
        usedAt: expect.any(Date),
      },
    })

    // Verifica a ordem: updateMany foi chamado antes de create
    const updateManyOrder = mockPrisma.passwordResetToken.updateMany.mock.invocationCallOrder[0]
    const createOrder = mockPrisma.passwordResetToken.create.mock.invocationCallOrder[0]
    expect(updateManyOrder).toBeLessThan(createOrder)
  })

  it('rate limit acionado → retorna resposta do rate limit', async () => {
    const rateLimitResponse = new Response(
      JSON.stringify({ error: 'RATE_LIMIT', message: 'Muitas tentativas' }),
      { status: 429 },
    )
    mockRateLimit.mockResolvedValue(rateLimitResponse as never)

    const res = await POST(makeRequest({ cpfCnpj: '12345678901' }))

    expect(res.status).toBe(429)
    expect(mockPrisma.user.findFirst).not.toHaveBeenCalled()
  })

  it('audit log registrado quando usuário encontrado', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(existingUser as never)
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 } as never)
    mockPrisma.passwordResetToken.create.mockResolvedValue({
      id: 'token-1',
      token: 'abc123',
      userId: existingUser.id,
    } as never)

    await POST(makeRequest({ cpfCnpj: '12345678901' }))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SENHA_RESET_SOLICITADO' }),
    )
  })
})
