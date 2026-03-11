import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as calcModule from '@/lib/results/calculate'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function makeGetRequest() {
  return new NextRequest('http://localhost:3000/api/admin/editais/ed-1/resultados')
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/editais/ed-1/resultados', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'ed-1') {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/admin/editais/[id]/resultados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('edital não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('retorna resultados ordenados', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: 'Edital X',
      status: 'RESULTADO_PRELIMINAR',
    } as never)
    mockPrisma.inscricao.findMany.mockResolvedValue([
      {
        id: 'i1',
        numero: 'INS-001',
        status: 'HABILITADA',
        categoria: 'Música',
        notaFinal: 8.5,
        proponente: { nome: 'Ana', cpfCnpj: '111' },
        avaliacoes: [{ notaTotal: 8.5, avaliadorId: 'av1' }],
      },
    ] as never)

    const res = await GET(makeGetRequest(), makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.resultados).toHaveLength(1)
    expect(body.resultados[0].proponenteNome).toBe('Ana')
  })
})

describe('POST /api/admin/editais/[id]/resultados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.edital.update.mockResolvedValue({} as never)
    mockPrisma.inscricao.findMany.mockResolvedValue([])
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }), makeParams())

    expect(res.status).toBe(403)
  })

  it('edital não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }), makeParams())

    expect(res.status).toBe(404)
  })

  it('sem inscrições avaliadas → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: 'Edital X',
      slug: 'edital-x-2025',
      status: 'AVALIACAO',
      vagasContemplados: null,
      vagasSuplentes: null,
    } as never)

    vi.spyOn(calcModule, 'calculateResults').mockResolvedValue([])

    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }), makeParams())

    expect(res.status).toBe(400)
  })

  it('POST RESULTADO_FINAL passa vagas para saveResults (GAP 4)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: 'Edital X',
      slug: 'edital-x-2025',
      status: 'AVALIACAO',
      vagasContemplados: 3,
      vagasSuplentes: 2,
    } as never)

    const resultados = [
      { inscricaoId: 'i1', proponenteNome: 'Ana', categoria: null, notaFinal: 9, totalAvaliacoes: 2 },
    ]
    vi.spyOn(calcModule, 'calculateResults').mockResolvedValue(resultados)
    const saveResultsSpy = vi.spyOn(calcModule, 'saveResults').mockResolvedValue(undefined)

    await POST(makePostRequest({ fase: 'RESULTADO_FINAL' }), makeParams())

    expect(saveResultsSpy).toHaveBeenCalledWith(resultados, 'RESULTADO_FINAL', {
      contemplados: 3,
      suplentes: 2,
    })
  })

  it('POST atualiza status do edital', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: 'Edital X',
      slug: 'edital-x-2025',
      status: 'AVALIACAO',
      vagasContemplados: null,
      vagasSuplentes: null,
    } as never)

    vi.spyOn(calcModule, 'calculateResults').mockResolvedValue([
      { inscricaoId: 'i1', proponenteNome: 'Ana', categoria: null, notaFinal: 9, totalAvaliacoes: 2 },
    ])
    vi.spyOn(calcModule, 'saveResults').mockResolvedValue(undefined)

    await POST(makePostRequest({ fase: 'RESULTADO_FINAL' }), makeParams())

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: { status: 'RESULTADO_FINAL' },
    })
  })
})
