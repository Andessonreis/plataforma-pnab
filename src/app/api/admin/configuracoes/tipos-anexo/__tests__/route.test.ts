import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

function makeGetRequest(tag?: string) {
  const url = tag
    ? `http://localhost:3000/api/admin/configuracoes/tipos-anexo?tag=${tag}`
    : 'http://localhost:3000/api/admin/configuracoes/tipos-anexo'
  return new NextRequest(url, { method: 'GET' })
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/configuracoes/tipos-anexo', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/admin/configuracoes/tipos-anexo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(403)
  })

  it('role não-ADMIN → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(403)
  })

  it('ADMIN → 200 com lista de tipos', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findMany
      .mockResolvedValueOnce([
        { id: '1', tipo: 'RG', label: 'RG', tag: 'PNAB', isSystem: true },
      ] as never)
      .mockResolvedValueOnce([{ tag: 'PNAB' }] as never)

    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.tags).toEqual(['PNAB'])
  })
})

describe('POST /api/admin/configuracoes/tipos-anexo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await POST(makePostRequest({ label: 'Teste', tag: 'PNAB' }))
    expect(res.status).toBe(403)
  })

  it('campos faltando → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    const res = await POST(makePostRequest({ label: '' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  it('não aceita campo tipo no body (gera automaticamente)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findFirst.mockResolvedValue(null as never)
    mockPrisma.attachmentType.create.mockResolvedValue({
      id: 'at-1',
      tipo: 'CERTIDAO_NEGATIVA',
      label: 'Certidão Negativa',
      tag: 'PNAB',
      obrigatorio: false,
      isSystem: false,
    } as never)

    const res = await POST(makePostRequest({
      label: 'Certidão Negativa',
      tag: 'PNAB',
      obrigatorio: false,
    }))

    expect(res.status).toBe(201)

    // Verifica que o tipo foi gerado a partir do label
    const createCall = mockPrisma.attachmentType.create.mock.calls[0][0]
    expect(createCall.data.tipo).toBe('CERTIDAO_NEGATIVA')
    expect(createCall.data.isSystem).toBe(false)
  })

  it('gera sufixo numérico quando tipo já existe', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    // findFirst retorna match → slug duplicado
    mockPrisma.attachmentType.findFirst.mockResolvedValue({
      id: 'existing',
      tipo: 'CERTIDAO_NEGATIVA',
    } as never)
    // findMany retorna similares para calcular sufixo
    mockPrisma.attachmentType.findMany.mockResolvedValue([
      { tipo: 'CERTIDAO_NEGATIVA' },
    ] as never)
    mockPrisma.attachmentType.create.mockResolvedValue({
      id: 'at-2',
      tipo: 'CERTIDAO_NEGATIVA_2',
      label: 'Certidão Negativa',
      tag: 'PNAB',
      obrigatorio: false,
      isSystem: false,
    } as never)

    const res = await POST(makePostRequest({
      label: 'Certidão Negativa',
      tag: 'PNAB',
    }))

    expect(res.status).toBe(201)
    const createCall = mockPrisma.attachmentType.create.mock.calls[0][0]
    expect(createCall.data.tipo).toBe('CERTIDAO_NEGATIVA_2')
  })

  it('gera sufixo _3 quando _2 já existe', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findFirst.mockResolvedValue({
      id: 'existing',
      tipo: 'RG',
    } as never)
    mockPrisma.attachmentType.findMany.mockResolvedValue([
      { tipo: 'RG' },
      { tipo: 'RG_2' },
    ] as never)
    mockPrisma.attachmentType.create.mockResolvedValue({
      id: 'at-3',
      tipo: 'RG_3',
      label: 'RG',
      tag: 'PNAB',
      obrigatorio: true,
      isSystem: false,
    } as never)

    const res = await POST(makePostRequest({
      label: 'RG',
      tag: 'PNAB',
      obrigatorio: true,
    }))

    expect(res.status).toBe(201)
    const createCall = mockPrisma.attachmentType.create.mock.calls[0][0]
    expect(createCall.data.tipo).toBe('RG_3')
  })

  it('registra audit log após criação', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findFirst.mockResolvedValue(null as never)
    mockPrisma.attachmentType.create.mockResolvedValue({
      id: 'at-1',
      tipo: 'TESTE',
      label: 'Teste',
      tag: 'PNAB',
      obrigatorio: false,
      isSystem: false,
    } as never)

    await POST(makePostRequest({ label: 'Teste', tag: 'PNAB' }))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'TIPO_ANEXO_CRIADO',
        entity: 'AttachmentType',
        entityId: 'at-1',
      }),
    )
  })
})
