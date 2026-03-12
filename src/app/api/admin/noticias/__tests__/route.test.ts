import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, PUT } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

const validNoticiaBody = {
  titulo: 'Nova notícia sobre o edital',
  corpo: 'Corpo da notícia com conteúdo suficiente para validação.',
  tags: ['cultura', 'edital'],
  publicado: true,
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/noticias', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makePutRequest(body: Record<string, unknown>, id?: string) {
  const url = id
    ? `http://localhost:3000/api/admin/noticias?id=${id}`
    : 'http://localhost:3000/api/admin/noticias'
  return new NextRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/noticias', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('dados válidos → 201 + slug', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.noticia.findUnique.mockResolvedValue(null)
    mockPrisma.noticia.create.mockResolvedValue({
      id: 'not-1',
      titulo: validNoticiaBody.titulo,
      slug: 'nova-noticia-sobre-o-edital-abc123',
      publicado: true,
    } as never)

    const res = await POST(makePostRequest(validNoticiaBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.slug).toBeDefined()
    expect(body.id).toBe('not-1')
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makePostRequest(validNoticiaBody))

    expect(res.status).toBe(403)
  })

  it('título curto → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makePostRequest({ ...validNoticiaBody, titulo: 'AB' }))

    expect(res.status).toBe(400)
  })

  it('audit log registrado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.noticia.findUnique.mockResolvedValue(null)
    mockPrisma.noticia.create.mockResolvedValue({
      id: 'not-1',
      titulo: validNoticiaBody.titulo,
      slug: 'nova-noticia-abc',
      publicado: true,
    } as never)

    await POST(makePostRequest(validNoticiaBody))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'NOTICIA_CRIADA',
        entity: 'Noticia',
        entityId: 'not-1',
      }),
    )
  })
})

describe('PUT /api/admin/noticias', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('atualiza → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.noticia.findUnique.mockResolvedValue({
      id: 'not-1',
      titulo: validNoticiaBody.titulo,
      slug: 'nova-noticia-abc',
    } as never)
    mockPrisma.noticia.update.mockResolvedValue({
      id: 'not-1',
      titulo: validNoticiaBody.titulo,
      slug: 'nova-noticia-abc',
      publicado: true,
    } as never)

    const res = await PUT(makePutRequest(validNoticiaBody, 'not-1'))

    expect(res.status).toBe(200)
    expect(mockPrisma.noticia.update).toHaveBeenCalled()
  })

  it('sem id → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await PUT(makePutRequest(validNoticiaBody))

    expect(res.status).toBe(400)
  })

  it('id inexistente → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.noticia.findUnique.mockResolvedValue(null)

    const res = await PUT(makePutRequest(validNoticiaBody, 'not-999'))

    expect(res.status).toBe(404)
  })
})
