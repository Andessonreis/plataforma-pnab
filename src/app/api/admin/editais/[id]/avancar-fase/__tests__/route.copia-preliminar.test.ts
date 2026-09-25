import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { guardarResultadoPreliminar } from '@/lib/results/resultado-publico'

vi.mock('@/lib/results/resultado-publico', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/results/resultado-publico')>()),
  guardarResultadoPreliminar: vi.fn(),
}))

const mockPrisma = vi.mocked(prisma)

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/editais/ed-1/avancar-fase', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const params = { params: Promise.resolve({ id: 'ed-1' }) }

function edital(status: string, extra: Record<string, unknown> = {}) {
  mockPrisma.edital.findUnique.mockResolvedValue({
    id: 'ed-1', status, titulo: 'Festival', publishedAt: new Date(), ...extra,
  } as never)
}

describe('avançar fase — cópia do resultado preliminar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(logAudit).mockResolvedValue(undefined)
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.update.mockResolvedValue({} as never)
    mockPrisma.recurso.count.mockResolvedValue(0 as never)
  })

  it('ao sair do preliminar sem cópia guardada, congela a lista antes de avançar', async () => {
    edital('RECURSO')
    await POST(makeReq({ proximoStatus: 'RESULTADO_FINAL', justificativa: 'recursos todos julgados' }), params)

    expect(guardarResultadoPreliminar).toHaveBeenCalledWith('ed-1')
  })

  it('com a cópia já guardada, não congela de novo', async () => {
    edital('RECURSO', { resultadoPreliminar: { publicadoEm: '2026-09-22T17:16:50.000Z', linhas: [] } })
    await POST(makeReq({ proximoStatus: 'RESULTADO_FINAL', justificativa: 'recursos todos julgados' }), params)

    expect(guardarResultadoPreliminar).not.toHaveBeenCalled()
  })

  it('transição que não sai do preliminar não mexe na cópia', async () => {
    edital('HABILITACAO')
    await POST(makeReq({ proximoStatus: 'AVALIACAO', justificativa: 'habilitação concluída' }), params)

    expect(guardarResultadoPreliminar).not.toHaveBeenCalled()
  })
})
