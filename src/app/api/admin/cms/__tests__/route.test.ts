import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, PUT } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { sanitizeContent } from '@/lib/sanitize'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)
const mockSanitize = vi.mocked(sanitizeContent)

const validCmsBody = {
  titulo: 'Sobre a Secretaria de Cultura',
  corpo: '<p>Conteudo da pagina sobre a secretaria.</p>',
  publicado: true,
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/cms', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makePutRequest(body: Record<string, unknown>, id?: string) {
  const url = id
    ? `http://localhost:3000/api/admin/cms?id=${id}`
    : 'http://localhost:3000/api/admin/cms'
  return new NextRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/cms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
    mockSanitize.mockImplementation((html: string) => html)
  })

  it('dados validos → 201 + slug', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.cmsPage.findUnique.mockResolvedValue(null)
    mockPrisma.cmsPage.create.mockResolvedValue({
      id: 'cms-1',
      titulo: validCmsBody.titulo,
      slug: 'sobre-a-secretaria-de-cultura',
      corpo: validCmsBody.corpo,
      publicado: true,
    } as never)

    const res = await POST(makePostRequest(validCmsBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('cms-1')
    expect(body.slug).toBeDefined()
  })

  it('slug colisao → slug com sufixo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    // findUnique retorna existente — slug ja existe
    mockPrisma.cmsPage.findUnique.mockResolvedValue({
      id: 'cms-existing',
      slug: 'sobre-a-secretaria-de-cultura',
    } as never)
    mockPrisma.cmsPage.create.mockResolvedValue({
      id: 'cms-2',
      titulo: validCmsBody.titulo,
      slug: 'sobre-a-secretaria-de-cultura-abc123',
      corpo: validCmsBody.corpo,
      publicado: true,
    } as never)

    const res = await POST(makePostRequest(validCmsBody))

    expect(res.status).toBe(201)
    // O create deve ter sido chamado com slug contendo sufixo
    expect(mockPrisma.cmsPage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: expect.stringMatching(/^sobre-a-secretaria-de-cultura-.+/),
      }),
    })
  })

  it('sanitizeContent e chamado no corpo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.cmsPage.findUnique.mockResolvedValue(null)
    mockPrisma.cmsPage.create.mockResolvedValue({
      id: 'cms-3',
      titulo: validCmsBody.titulo,
      slug: 'sobre-a-secretaria-de-cultura',
      corpo: validCmsBody.corpo,
      publicado: true,
    } as never)

    await POST(makePostRequest(validCmsBody))

    expect(mockSanitize).toHaveBeenCalledWith(validCmsBody.corpo)
  })

  it('sem sessao → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makePostRequest(validCmsBody))

    expect(res.status).toBe(403)
  })

  it('role nao-ADMIN → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)

    const res = await POST(makePostRequest(validCmsBody))

    expect(res.status).toBe(403)
  })

  it('titulo curto → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makePostRequest({ ...validCmsBody, titulo: 'AB' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  it('corpo vazio → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makePostRequest({ ...validCmsBody, corpo: '' }))

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/admin/cms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
    mockSanitize.mockImplementation((html: string) => html)
  })

  it('atualiza → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.cmsPage.findUnique.mockResolvedValue({
      id: 'cms-1',
      titulo: validCmsBody.titulo,
      slug: 'sobre-a-secretaria-de-cultura',
    } as never)
    mockPrisma.cmsPage.findFirst.mockResolvedValue(null)
    mockPrisma.cmsPage.update.mockResolvedValue({
      id: 'cms-1',
      titulo: 'Titulo Atualizado',
      slug: 'titulo-atualizado',
      corpo: validCmsBody.corpo,
      publicado: true,
    } as never)

    const res = await PUT(makePutRequest({ ...validCmsBody, titulo: 'Titulo Atualizado' }, 'cms-1'))

    expect(res.status).toBe(200)
    expect(mockPrisma.cmsPage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cms-1' },
      }),
    )
  })

  it('id inexistente → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.cmsPage.findUnique.mockResolvedValue(null)

    const res = await PUT(makePutRequest(validCmsBody, 'cms-999'))

    expect(res.status).toBe(404)
  })

  it('sem id → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await PUT(makePutRequest(validCmsBody))

    expect(res.status).toBe(400)
  })

  it('audit log registrado apos update', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.cmsPage.findUnique.mockResolvedValue({
      id: 'cms-1',
      titulo: validCmsBody.titulo,
      slug: 'sobre-a-secretaria-de-cultura',
    } as never)
    mockPrisma.cmsPage.findFirst.mockResolvedValue(null)
    mockPrisma.cmsPage.update.mockResolvedValue({
      id: 'cms-1',
      titulo: validCmsBody.titulo,
      slug: 'sobre-a-secretaria-de-cultura',
      corpo: validCmsBody.corpo,
      publicado: true,
    } as never)

    await PUT(makePutRequest(validCmsBody, 'cms-1'))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'CMS_PAGINA_ATUALIZADA',
        entity: 'CmsPage',
        entityId: 'cms-1',
      }),
    )
  })
})
