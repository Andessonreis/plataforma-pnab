import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PUT } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function makeRequest(body: Record<string, unknown> = { campos: { nome_projeto: 'Teste' } }) {
  return new NextRequest('http://localhost:3000/api/proponente/inscricoes/insc-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

const baseInscricao = {
  id: 'insc-1',
  proponenteId: 'user-1',
  editalId: 'edital-1',
  status: 'RASCUNHO',
}

describe('PUT /api/proponente/inscricoes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.inscricao.update.mockResolvedValue({
      id: 'insc-1',
      edital: { id: 'edital-1', titulo: 'Edital', categorias: [], camposFormulario: [] },
      anexos: [],
    } as never)
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await PUT(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('role !== PROPONENTE → 401', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await PUT(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('inscrição não encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)

    const res = await PUT(makeRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('inscrição de outro proponente → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'other-user', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await PUT(makeRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('status !== RASCUNHO → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({ ...baseInscricao, status: 'ENVIADA' } as never)

    const res = await PUT(makeRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.message).toContain('rascunhos')
  })

  it('edição válida → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await PUT(makeRequest({ campos: { nome: 'Novo Nome' } }), makeParams())

    expect(res.status).toBe(200)
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'insc-1' },
        data: expect.objectContaining({ campos: { nome: 'Novo Nome' } }),
      }),
    )
  })

  it('categoria inválida → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      categorias: ['Música', 'Dança'],
    } as never)

    const res = await PUT(makeRequest({ categoria: 'Inexistente' }), makeParams())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('Categoria inválida')
  })
})
