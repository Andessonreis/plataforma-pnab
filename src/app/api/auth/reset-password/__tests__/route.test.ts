import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)
const mockBcrypt = vi.mocked(bcrypt)

const validToken = {
  id: 'token-1',
  token: 'valid-token-hash-abc123',
  userId: 'user-1',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora no futuro
  usedAt: null,
  createdAt: new Date(),
  user: {
    id: 'user-1',
    nome: 'Maria Silva',
    email: 'maria@example.com',
  },
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
    mockBcrypt.hash.mockResolvedValue('$2a$12$newhashedpassword' as never)
  })

  it('token válido + nova senha → 200', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validToken as never)
    mockPrisma.user.update.mockResolvedValue({ id: 'user-1' } as never)
    mockPrisma.passwordResetToken.update.mockResolvedValue({ id: 'token-1' } as never)
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 } as never)
    mockPrisma.$transaction.mockResolvedValue([{}, {}, {}] as never)

    const res = await POST(makeRequest({
      token: 'valid-token-hash-abc123',
      password: 'novaSenha123',
    }))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain('Senha redefinida')
  })

  it('token expirado → 400 INVALID_TOKEN', async () => {
    const expiredToken = {
      ...validToken,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
    }
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(expiredToken as never)

    const res = await POST(makeRequest({
      token: 'valid-token-hash-abc123',
      password: 'novaSenha123',
    }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('INVALID_TOKEN')
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('token já usado (usedAt definido) → 400 INVALID_TOKEN', async () => {
    const usedToken = {
      ...validToken,
      usedAt: new Date(),
    }
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(usedToken as never)

    const res = await POST(makeRequest({
      token: 'valid-token-hash-abc123',
      password: 'novaSenha123',
    }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('INVALID_TOKEN')
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('token inexistente → 400 INVALID_TOKEN', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null)

    const res = await POST(makeRequest({
      token: 'token-que-nao-existe',
      password: 'novaSenha123',
    }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('INVALID_TOKEN')
  })

  it('senha fraca (< 8 caracteres) → 400 VALIDATION_ERROR', async () => {
    const res = await POST(makeRequest({
      token: 'valid-token-hash-abc123',
      password: '123',
    }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('VALIDATION_ERROR')
  })

  it('$transaction chamado com 3 operações', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validToken as never)
    mockPrisma.user.update.mockResolvedValue({ id: 'user-1' } as never)
    mockPrisma.passwordResetToken.update.mockResolvedValue({ id: 'token-1' } as never)
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 } as never)
    mockPrisma.$transaction.mockResolvedValue([{}, {}, {}] as never)

    await POST(makeRequest({
      token: 'valid-token-hash-abc123',
      password: 'novaSenha123',
    }))

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    // A transação recebe um array com 3 operações (promises)
    const transactionArg = mockPrisma.$transaction.mock.calls[0][0]
    expect(transactionArg).toHaveLength(3)
  })

  it('audit log registrado após reset bem-sucedido', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validToken as never)
    mockPrisma.user.update.mockResolvedValue({ id: 'user-1' } as never)
    mockPrisma.passwordResetToken.update.mockResolvedValue({ id: 'token-1' } as never)
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 } as never)
    mockPrisma.$transaction.mockResolvedValue([{}, {}, {}] as never)

    await POST(makeRequest({
      token: 'valid-token-hash-abc123',
      password: 'novaSenha123',
    }))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SENHA_RESET_CONCLUIDO' }),
    )
  })
})
