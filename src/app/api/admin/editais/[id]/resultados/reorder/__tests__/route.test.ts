import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import * as calcModule from '@/lib/results/calculate'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockLogAudit = vi.mocked(logAudit)

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/editais/ed-1/resultados/reorder', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'ed-1') {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/admin/editais/[id]/resultados/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 403 para não-admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', role: 'PROPONENTE', name: 'Test', email: 't@t.com' },
      expires: '',
    } as never)

    const res = await PATCH(makeRequest({ orderedIds: ['a'] }), makeParams())
    expect(res.status).toBe(403)
  })

  it('retorna 403 sem sessão', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await PATCH(makeRequest({ orderedIds: ['a'] }), makeParams())
    expect(res.status).toBe(403)
  })

  it('retorna 400 para body inválido (array vazio)', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', name: 'Admin', email: 'a@a.com' },
      expires: '',
    } as never)

    const res = await PATCH(makeRequest({ orderedIds: [] }), makeParams())
    expect(res.status).toBe(400)
  })

  it('retorna 400 para body sem orderedIds', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', name: 'Admin', email: 'a@a.com' },
      expires: '',
    } as never)

    const res = await PATCH(makeRequest({}), makeParams())
    expect(res.status).toBe(400)
  })

  it('retorna 200 e chama saveManualOrder com dados válidos', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', name: 'Admin', email: 'a@a.com' },
      expires: '',
    } as never)

    const mockSave = vi.spyOn(calcModule, 'saveManualOrder').mockResolvedValue(undefined)
    mockLogAudit.mockResolvedValue(undefined)

    const res = await PATCH(makeRequest({ orderedIds: ['a', 'b'] }), makeParams())
    expect(res.status).toBe(200)

    expect(mockSave).toHaveBeenCalledWith('ed-1', ['a', 'b'])
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'DESEMPATE_MANUAL',
        entity: 'Edital',
        entityId: 'ed-1',
      }),
    )

    mockSave.mockRestore()
  })

  it('retorna 400 quando IDs não pertencem ao edital', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', name: 'Admin', email: 'a@a.com' },
      expires: '',
    } as never)

    const mockSave = vi.spyOn(calcModule, 'saveManualOrder')
      .mockRejectedValue(new Error('Inscrição xyz não pertence ao edital ed-1'))
    mockLogAudit.mockResolvedValue(undefined)

    const res = await PATCH(makeRequest({ orderedIds: ['xyz'] }), makeParams())
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.message).toContain('não pertence')

    mockSave.mockRestore()
  })
})
