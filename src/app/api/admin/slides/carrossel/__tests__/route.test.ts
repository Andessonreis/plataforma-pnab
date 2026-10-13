import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { obterCarrossel } from '@/lib/services/carrossel.service'
import { PUT } from '../route'

const mockAuth = vi.mocked(auth)
// SiteConfig não está no mock global do Prisma; entra só aqui.
const siteConfig = { findUnique: vi.fn(), upsert: vi.fn() }
Object.assign(prisma, { siteConfig })

const put = (body: unknown) =>
  PUT(
    new NextRequest('http://localhost:3000/api/admin/slides/carrossel', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  )

describe('PUT /api/admin/slides/carrossel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(logAudit).mockResolvedValue(undefined)
  })

  it.each(['COMUNICACAO', 'ADMIN', 'SUPER_ADMIN'])('%s salva, audita e revalida a home', async (role) => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role } } as never)
    const res = await put({ intervaloSegundos: 8, automatico: true })
    expect(res.status).toBe(200)
    expect(siteConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { chave: 'carrossel' }, update: expect.objectContaining({ valor: { intervaloSegundos: 8, automatico: true } }) }),
    )
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'CARROSSEL_CONFIGURADO' }))
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('PROPONENTE e anônimo → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'PROPONENTE' } } as never)
    expect((await put({ intervaloSegundos: 8 })).status).toBe(403)
    mockAuth.mockResolvedValue(null as never)
    expect((await put({ intervaloSegundos: 8 })).status).toBe(403)
    expect(siteConfig.upsert).not.toHaveBeenCalled()
  })

  it('fora de 3 a 30 segundos → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'COMUNICACAO' } } as never)
    expect((await put({ intervaloSegundos: 2 })).status).toBe(400)
    expect((await put({ intervaloSegundos: 31 })).status).toBe(400)
  })
})

describe('obterCarrossel', () => {
  it('sem linha gravada ou com valor inválido cai no padrão de 5 segundos', async () => {
    siteConfig.findUnique.mockResolvedValueOnce(null)
    expect(await obterCarrossel()).toEqual({ intervaloSegundos: 5, automatico: true })
    siteConfig.findUnique.mockResolvedValueOnce({ valor: { intervaloSegundos: 'x' } })
    expect(await obterCarrossel()).toEqual({ intervaloSegundos: 5, automatico: true })
  })
})
