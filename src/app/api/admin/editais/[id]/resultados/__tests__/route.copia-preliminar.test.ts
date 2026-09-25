import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as calcModule from '@/lib/results/calculate'
import * as publicoModule from '@/lib/results/resultado-publico'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/editais/ed-1/resultados', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const params = { params: Promise.resolve({ id: 'ed-1' }) }

describe('POST /api/admin/editais/[id]/resultados — cópia do resultado preliminar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1', titulo: 'Edital X', slug: 'edital-x-2025', status: 'AVALIACAO',
      vagasContemplados: null, vagasSuplentes: null, notaMinima: null, categoriasConfig: null,
    } as never)
    vi.spyOn(calcModule, 'calculateResults').mockResolvedValue([
      { inscricaoId: 'i1', proponenteNome: 'Ana', categoria: null, cotasOptIn: [], notaFinal: 9, totalAvaliacoes: 2 },
    ])
    vi.spyOn(calcModule, 'saveResults').mockResolvedValue(undefined)
  })

  it('publicar o preliminar guarda a lista antes de mudar o status do edital', async () => {
    const ordem: string[] = []
    vi.spyOn(publicoModule, 'guardarResultadoPreliminar').mockImplementation(async () => { ordem.push('copia') })
    mockPrisma.edital.update.mockImplementation((async () => { ordem.push('status') }) as never)

    await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }), params)

    expect(ordem).toEqual(['copia', 'status'])
    expect(publicoModule.guardarResultadoPreliminar).toHaveBeenCalledWith('ed-1')
  })

  it('publicar o resultado final não mexe na cópia do preliminar', async () => {
    const guardar = vi.spyOn(publicoModule, 'guardarResultadoPreliminar').mockResolvedValue(undefined)

    await POST(makePostRequest({ fase: 'RESULTADO_FINAL' }), params)

    expect(guardar).not.toHaveBeenCalled()
  })
})
