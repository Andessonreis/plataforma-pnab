import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache antes do import da route — revalidatePath roda no contexto Next
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@server/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

const validSlideBody = {
  titulo: 'Slide de teste sobre editais',
  descricao: 'Descrição do slide de teste.',
  ctaLabel: 'Saiba mais',
  ctaUrl: '/editais',
  ordem: 1,
  ativo: true,
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/slides', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/slides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('dados válidos → 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.slideDestaque.create.mockResolvedValue({
      id: 'slide-1',
      titulo: validSlideBody.titulo,
      ativo: true,
    } as never)

    const res = await POST(makePostRequest(validSlideBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('slide-1')
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makePostRequest(validSlideBody))

    expect(res.status).toBe(403)
  })

  it('título curto → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makePostRequest({ ...validSlideBody, titulo: 'AB' }))

    expect(res.status).toBe(400)
  })

  it('role não-ADMIN → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'PROPONENTE' } } as never)

    const res = await POST(makePostRequest(validSlideBody))

    expect(res.status).toBe(403)
  })

  it('audit log registrado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.slideDestaque.create.mockResolvedValue({
      id: 'slide-1',
      titulo: validSlideBody.titulo,
      ativo: true,
    } as never)

    await POST(makePostRequest(validSlideBody))

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'SLIDE_CRIADO',
        entity: 'SlideDestaque',
        entityId: 'slide-1',
      }),
    )
  })
})
