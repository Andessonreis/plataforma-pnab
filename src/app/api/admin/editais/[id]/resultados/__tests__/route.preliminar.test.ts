import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as calcModule from '@/lib/results/calculate'
import { avisarProponentesDoResultado } from '@/lib/results/avisar-resultado'
import { publicarResultadoPreliminar } from '@/lib/services/publicar-preliminar.service'
import { ServiceError } from '@/lib/services/errors'

vi.mock('@/lib/services/publicar-preliminar.service', () => ({ publicarResultadoPreliminar: vi.fn() }))
vi.mock('@/lib/results/avisar-resultado', () => ({ avisarProponentesDoResultado: vi.fn() }))

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockPublicar = vi.mocked(publicarResultadoPreliminar)
const mockAvisar = vi.mocked(avisarProponentesDoResultado)

function makePostRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/admin/editais/ed-1/resultados', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

const params = { params: Promise.resolve({ id: 'ed-1' }) }
const PUBLICADO = { total: 10, contempladas: 5, suplentes: 5, naoContempladas: 0, hasEmpates: false, avisos: [] as string[] }

describe('POST /api/admin/editais/[id]/resultados — resultado preliminar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPublicar.mockResolvedValue(PUBLICADO)
  })

  it('entrega a publicação ao serviço, com o usuário e o IP, e sem aviso por e-mail por padrão', async () => {
    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }, { 'x-forwarded-for': '10.0.0.1' }), params)

    expect(res.status).toBe(200)
    expect(mockPublicar).toHaveBeenCalledWith({ editalId: 'ed-1', userId: 'u1', ip: '10.0.0.1', avisarPorEmail: false })
  })

  it('repassa o pedido de aviso por e-mail', async () => {
    await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR', avisarPorEmail: true }), params)

    expect(mockPublicar).toHaveBeenCalledWith(expect.objectContaining({ avisarPorEmail: true }))
  })

  it('responde com a mensagem, o total e os avisos do cronograma', async () => {
    mockPublicar.mockResolvedValue({ ...PUBLICADO, avisos: ['O cronograma não tem o marco do período de recursos.'] })

    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }), params)
    const corpo = await res.json()

    expect(corpo).toMatchObject({
      message: 'Resultado preliminar publicado com sucesso.', totalInscrições: 10, hasEmpates: false,
      avisos: ['O cronograma não tem o marco do período de recursos.'],
    })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })

  it.each([
    ['NOT_FOUND', 404], ['CONFLICT', 409], ['BAD_REQUEST', 400],
  ] as const)('erro %s do serviço vira HTTP %i com a mensagem', async (code, status) => {
    mockPublicar.mockRejectedValue(new ServiceError(code, 'Mensagem do serviço.'))

    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }), params)

    expect(res.status).toBe(status)
    expect(await res.json()).toMatchObject({ error: code, message: 'Mensagem do serviço.' })
  })

  it('erro inesperado vira 500 sem vazar a causa', async () => {
    mockPublicar.mockRejectedValue(new Error('connection refused'))

    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }), params)

    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('connection refused')
  })

  it('avisarPorEmail que não é booleano → 400, sem publicar', async () => {
    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR', avisarPorEmail: 'sim' }), params)

    expect(res.status).toBe(400)
    expect(mockPublicar).not.toHaveBeenCalled()
  })

  it('quem não é admin não publica', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'PROPONENTE' } } as never)

    const res = await POST(makePostRequest({ fase: 'RESULTADO_PRELIMINAR' }), params)

    expect(res.status).toBe(403)
    expect(mockPublicar).not.toHaveBeenCalled()
  })
})

describe('POST /api/admin/editais/[id]/resultados — resultado final segue pelo caminho próprio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1', titulo: 'Edital X', slug: 'edital-x-2025', status: 'RECURSO',
      vagasContemplados: null, vagasSuplentes: null, notaMinima: null, categoriasConfig: null,
    } as never)
    mockPrisma.edital.update.mockResolvedValue({} as never)
    vi.spyOn(calcModule, 'calculateResults').mockResolvedValue([
      { inscricaoId: 'i1', proponenteNome: 'Ana', categoria: null, cotasOptIn: [], notaFinal: 9, totalAvaliacoes: 2 },
    ])
    vi.spyOn(calcModule, 'saveResults').mockResolvedValue(undefined)
  })

  it('não passa pelo serviço do preliminar e sempre avisa os proponentes', async () => {
    const res = await POST(makePostRequest({ fase: 'RESULTADO_FINAL' }), params)

    expect(res.status).toBe(200)
    expect(mockPublicar).not.toHaveBeenCalled()
    expect(mockAvisar).toHaveBeenCalledWith({
      inscricaoIds: ['i1'], editalTitulo: 'Edital X', slug: 'edital-x-2025', final: true,
    })
  })
})
