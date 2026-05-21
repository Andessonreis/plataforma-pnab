import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT, DELETE } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/configuracoes/tipos-anexo/at-1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeGetRequest() {
  return new NextRequest('http://localhost:3000/api/admin/configuracoes/tipos-anexo/at-1', {
    method: 'GET',
  })
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost:3000/api/admin/configuracoes/tipos-anexo/at-1', {
    method: 'DELETE',
  })
}

describe('GET /api/admin/configuracoes/tipos-anexo/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(makeGetRequest(), makeCtx('at-1'))
    expect(res.status).toBe(403)
  })

  it('tipo não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue(null as never)
    const res = await GET(makeGetRequest(), makeCtx('at-999'))
    expect(res.status).toBe(404)
  })

  it('ADMIN → 200 com dados do tipo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue({
      id: 'at-1',
      tipo: 'RG',
      label: 'RG',
      tag: 'PNAB',
      isSystem: true,
    } as never)

    const res = await GET(makeGetRequest(), makeCtx('at-1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.tipo).toBe('RG')
  })
})

describe('PUT /api/admin/configuracoes/tipos-anexo/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await PUT(
      makePutRequest({ label: 'Teste', tag: 'PNAB' }),
      makeCtx('at-1'),
    )
    expect(res.status).toBe(403)
  })

  it('tipo não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue(null as never)
    const res = await PUT(
      makePutRequest({ label: 'Teste', tag: 'PNAB' }),
      makeCtx('at-999'),
    )
    expect(res.status).toBe(404)
  })

  it('campos inválidos → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue({
      id: 'at-1',
      tipo: 'RG',
      isSystem: false,
    } as never)

    const res = await PUT(
      makePutRequest({ label: '' }),
      makeCtx('at-1'),
    )
    expect(res.status).toBe(400)
  })

  it('tipo do sistema → atualiza apenas label e obrigatório', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue({
      id: 'at-1',
      tipo: 'RG',
      label: 'RG',
      tag: 'PNAB',
      isSystem: true,
    } as never)
    mockPrisma.attachmentType.update.mockResolvedValue({
      id: 'at-1',
      tipo: 'RG',
      label: 'RG - Frente e Verso',
      tag: 'PNAB',
      isSystem: true,
    } as never)

    const res = await PUT(
      makePutRequest({ label: 'RG - Frente e Verso', tag: 'OUTRA', obrigatorio: true }),
      makeCtx('at-1'),
    )

    expect(res.status).toBe(200)
    const updateCall = mockPrisma.attachmentType.update.mock.calls[0][0]
    // Sistema: só label e obrigatorio
    expect(updateCall.data).toEqual({ label: 'RG - Frente e Verso', obrigatorio: true })
    // Não atualiza tipo nem tag
    expect(updateCall.data).not.toHaveProperty('tipo')
    expect(updateCall.data).not.toHaveProperty('tag')
  })

  it('tipo custom → atualiza label, obrigatório e tag (sem tipo)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue({
      id: 'at-2',
      tipo: 'CERTIFICADO_PNCV',
      label: 'Certificado PNCV',
      tag: 'Cultura Viva',
      isSystem: false,
    } as never)
    mockPrisma.attachmentType.update.mockResolvedValue({
      id: 'at-2',
      tipo: 'CERTIFICADO_PNCV',
      label: 'Certificado PNCV atualizado',
      tag: 'PNAB',
      isSystem: false,
    } as never)

    const res = await PUT(
      makePutRequest({ label: 'Certificado PNCV atualizado', tag: 'PNAB', obrigatorio: false }),
      makeCtx('at-2'),
    )

    expect(res.status).toBe(200)
    const updateCall = mockPrisma.attachmentType.update.mock.calls[0][0]
    // Custom: label, obrigatório, tag — SEM tipo
    expect(updateCall.data).toEqual({
      label: 'Certificado PNCV atualizado',
      obrigatorio: false,
      tag: 'PNAB',
    })
    expect(updateCall.data).not.toHaveProperty('tipo')
  })

  it('registra audit log', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue({
      id: 'at-1',
      tipo: 'RG',
      isSystem: false,
    } as never)
    mockPrisma.attachmentType.update.mockResolvedValue({
      id: 'at-1',
      tipo: 'RG',
      label: 'RG novo',
      tag: 'PNAB',
    } as never)

    await PUT(
      makePutRequest({ label: 'RG novo', tag: 'PNAB' }),
      makeCtx('at-1'),
    )

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TIPO_ANEXO_ATUALIZADO',
        entityId: 'at-1',
      }),
    )
  })
})

describe('DELETE /api/admin/configuracoes/tipos-anexo/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await DELETE(makeDeleteRequest(), makeCtx('at-1'))
    expect(res.status).toBe(403)
  })

  it('tipo não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue(null as never)
    const res = await DELETE(makeDeleteRequest(), makeCtx('at-999'))
    expect(res.status).toBe(404)
  })

  it('tipo do sistema → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue({
      id: 'at-1',
      tipo: 'RG',
      isSystem: true,
    } as never)

    const res = await DELETE(makeDeleteRequest(), makeCtx('at-1'))
    expect(res.status).toBe(403)
  })

  it('tipo custom → exclui com sucesso', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.attachmentType.findUnique.mockResolvedValue({
      id: 'at-2',
      tipo: 'CERTIFICADO_PNCV',
      label: 'Certificado PNCV',
      tag: 'Cultura Viva',
      isSystem: false,
    } as never)
    mockPrisma.attachmentType.delete.mockResolvedValue({} as never)

    const res = await DELETE(makeDeleteRequest(), makeCtx('at-2'))
    expect(res.status).toBe(200)
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TIPO_ANEXO_EXCLUIDO',
      }),
    )
  })
})
