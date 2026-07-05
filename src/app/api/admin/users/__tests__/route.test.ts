import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

const mockPrisma = vi.mocked(prisma)
const mockAuth = vi.mocked(auth)
const mockLogAudit = vi.mocked(logAudit)
const mockBcrypt = vi.mocked(bcrypt)

const adminSession = { user: { id: 'admin-1', role: 'ADMIN' } }

// CPF e CNPJ válidos por dígito verificador
const VALID_CPF = '52998224725'
const VALID_CNPJ = '11222333000181'

const validBody = {
  nome: 'João Avaliador',
  email: 'joao@exemplo.com',
  cpfCnpj: VALID_CPF,
  role: 'AVALIADOR',
  password: 'Senha@123',
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(adminSession as never)
    mockLogAudit.mockResolvedValue(undefined)
    mockBcrypt.hash.mockResolvedValue('$2a$12$hashedpassword' as never)
  })

  it('não autenticado → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(403)
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('role não-ADMIN → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'ATENDIMENTO' } } as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(403)
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('criação válida → 201 + id, senha hasheada', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'user-novo' } as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('user-novo')
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nome: validBody.nome,
        email: validBody.email,
        cpfCnpj: VALID_CPF,
        role: 'AVALIADOR',
        password: '$2a$12$hashedpassword',
        tipoProponente: null,
      }),
    })
  })

  it('CPF com máscara é normalizado para dígitos', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'user-novo' } as never)

    const res = await POST(makeRequest({ ...validBody, cpfCnpj: '529.982.247-25' }))

    expect(res.status).toBe(201)
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ cpfCnpj: VALID_CPF }),
    })
  })

  it('CNPJ válido → 201', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'user-novo' } as never)

    const res = await POST(makeRequest({
      ...validBody,
      cpfCnpj: VALID_CNPJ,
      role: 'PROPONENTE',
      tipoProponente: 'PJ',
    }))

    expect(res.status).toBe(201)
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ cpfCnpj: VALID_CNPJ, tipoProponente: 'PJ' }),
    })
  })

  it('CPF com dígito verificador inválido → 400 com fieldErrors.cpfCnpj', async () => {
    const res = await POST(makeRequest({ ...validBody, cpfCnpj: '12345678901' }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('VALIDATION_ERROR')
    expect(json.fieldErrors.cpfCnpj).toBeDefined()
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('senha fraca → 400 com fieldErrors.password', async () => {
    const res = await POST(makeRequest({ ...validBody, password: 'fraca' }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.fieldErrors.password).toBeDefined()
  })

  it('PROPONENTE sem tipoProponente → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, role: 'PROPONENTE' }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.fieldErrors.tipoProponente).toBeDefined()
  })

  it('role de equipe ignora tipoProponente enviado', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'user-novo' } as never)

    await POST(makeRequest({ ...validBody, role: 'HABILITADOR', tipoProponente: 'PF' }))

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: 'HABILITADOR', tipoProponente: null }),
    })
  })

  it('e-mail duplicado → 409 CONFLICT', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'existente',
      cpfCnpj: '99999999999',
      email: validBody.email,
    } as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.fieldErrors.email).toBeDefined()
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('CPF duplicado → 409 CONFLICT', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'existente',
      cpfCnpj: VALID_CPF,
      email: 'outro@exemplo.com',
    } as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.fieldErrors.cpfCnpj).toBeDefined()
  })

  it('audit log registrado com USUARIO_CRIADO', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'user-novo' } as never)

    await POST(makeRequest(validBody))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'USUARIO_CRIADO',
        entity: 'User',
        entityId: 'user-novo',
        details: { role: 'AVALIADOR' },
      }),
    )
  })
})
