import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, PUT } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

const validFaqBody = {
  pergunta: 'Como me inscrever no edital?',
  resposta: 'Acesse a página de editais e clique em inscrever-se.',
  ordem: 1,
  publicado: true,
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/faq', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makePutRequest(body: Record<string, unknown>, id?: string) {
  const url = id
    ? `http://localhost:3000/api/admin/faq?id=${id}`
    : 'http://localhost:3000/api/admin/faq'
  return new NextRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/faq', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('ADMIN → 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.faqItem.create.mockResolvedValue({
      id: 'faq-1',
      pergunta: validFaqBody.pergunta,
      publicado: true,
    } as never)

    const res = await POST(makePostRequest(validFaqBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('faq-1')
  })

  it('ATENDIMENTO → 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'ATENDIMENTO' } } as never)
    mockPrisma.faqItem.create.mockResolvedValue({
      id: 'faq-2',
      pergunta: validFaqBody.pergunta,
      publicado: true,
    } as never)

    const res = await POST(makePostRequest(validFaqBody))

    expect(res.status).toBe(201)
  })

  it('campos faltando → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makePostRequest({ pergunta: 'Ok' }))

    expect(res.status).toBe(400)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makePostRequest(validFaqBody))

    expect(res.status).toBe(403)
  })
})

describe('PUT /api/admin/faq', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('ADMIN → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.faqItem.findUnique.mockResolvedValue({
      id: 'faq-1',
      pergunta: 'Pergunta antiga',
    } as never)
    mockPrisma.faqItem.update.mockResolvedValue({
      id: 'faq-1',
      pergunta: validFaqBody.pergunta,
      publicado: true,
    } as never)

    const res = await PUT(makePutRequest(validFaqBody, 'faq-1'))

    expect(res.status).toBe(200)
    expect(mockPrisma.faqItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'faq-1' },
      }),
    )
  })

  it('id inexistente → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.faqItem.findUnique.mockResolvedValue(null)

    const res = await PUT(makePutRequest(validFaqBody, 'faq-999'))

    expect(res.status).toBe(404)
  })
})
