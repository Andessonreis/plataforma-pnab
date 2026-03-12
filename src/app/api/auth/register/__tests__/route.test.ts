import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)
const mockRateLimit = vi.mocked(rateLimit)
const mockBcrypt = vi.mocked(bcrypt)

const validBody = {
  nome: 'Maria Silva',
  cpfCnpj: '12345678901',
  email: 'maria@example.com',
  cep: '44900000',
  logradouro: 'Rua das Flores',
  bairro: 'Centro',
  cidade: 'Irecê',
  uf: 'BA',
  password: 'senhaForte123',
  tipoProponente: 'PF',
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
    mockRateLimit.mockResolvedValue(null as never)
    mockBcrypt.hash.mockResolvedValue('$2a$12$hashedpassword' as never)
  })

  it('cadastro válido → 201 + userId', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      nome: validBody.nome,
      cpfCnpj: validBody.cpfCnpj,
      email: validBody.email,
      role: 'PROPONENTE',
    } as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.userId).toBe('user-1')
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nome: validBody.nome,
        cpfCnpj: validBody.cpfCnpj,
        email: validBody.email,
        role: 'PROPONENTE',
        password: '$2a$12$hashedpassword',
      }),
    })
  })

  it('CPF duplicado → 409 CONFLICT', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'existing-user',
      cpfCnpj: validBody.cpfCnpj,
      email: 'outro@example.com',
    } as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe('CONFLICT')
    expect(json.message).toContain('CPF/CNPJ')
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('email duplicado → 409 CONFLICT', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'existing-user',
      cpfCnpj: '99999999999',
      email: validBody.email,
    } as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe('CONFLICT')
    expect(json.message).toContain('E-mail')
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('senha curta (< 8) → 400 VALIDATION_ERROR', async () => {
    const res = await POST(makeRequest({ ...validBody, password: '123' }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('VALIDATION_ERROR')
  })

  it('campo obrigatório faltando (nome) → 400', async () => {
    const { nome: _, ...semNome } = validBody
    const res = await POST(makeRequest(semNome))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('VALIDATION_ERROR')
  })

  it('CPF curto → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, cpfCnpj: '123' }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('VALIDATION_ERROR')
  })

  it('rate limit acionado → retorna resposta do rate limit', async () => {
    const rateLimitResponse = new Response(
      JSON.stringify({ error: 'RATE_LIMIT', message: 'Muitas tentativas' }),
      { status: 429 },
    )
    mockRateLimit.mockResolvedValue(rateLimitResponse as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(429)
    expect(mockPrisma.user.findFirst).not.toHaveBeenCalled()
  })

  it('audit log registrado após cadastro', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      nome: validBody.nome,
      cpfCnpj: validBody.cpfCnpj,
      email: validBody.email,
      role: 'PROPONENTE',
    } as never)

    await POST(makeRequest(validBody))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CADASTRO' }),
    )
  })
})
