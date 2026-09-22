import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { auth } from '@/lib/auth'
import { ServiceError } from '@/lib/services/errors'
import { emitirRelatorioRecursos } from '@/lib/services/relatorio-recursos.service'

vi.mock('@/lib/services/relatorio-recursos.service', () => ({ emitirRelatorioRecursos: vi.fn() }))

const mockAuth = vi.mocked(auth)
const mockEmitir = vi.mocked(emitirRelatorioRecursos)

function makeReq(query = '?etapa=habilitacao', headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000/api/admin/editais/ed-1/relatorio-recursos${query}`, { headers })
}

function params(id = 'ed-1') {
  return { params: Promise.resolve({ id }) }
}

function comoAdmin(role = 'ADMIN') {
  mockAuth.mockResolvedValue({ user: { id: 'admin-1', role } } as never)
}

describe('GET /api/admin/editais/[id]/relatorio-recursos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(401)
    expect(mockEmitir).not.toHaveBeenCalled()
  })

  it.each(['PROPONENTE', 'HABILITADOR', 'AVALIADOR', 'COMUNICACAO'])('%s → 403', async (role) => {
    comoAdmin(role)

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(403)
    expect(mockEmitir).not.toHaveBeenCalled()
  })

  it.each(['', '?etapa=inscricao', '?etapa='])('etapa ausente ou inválida (%s) → 400', async (query) => {
    comoAdmin()

    const res = await GET(makeReq(query), params())

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('BAD_REQUEST')
    expect(mockEmitir).not.toHaveBeenCalled()
  })

  it('prazo em curso (LOCKED) → 422 com a mensagem do serviço', async () => {
    comoAdmin()
    mockEmitir.mockRejectedValue(new ServiceError('LOCKED', 'O prazo de recursos ainda não terminou.'))

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(422)
    expect(await res.json()).toMatchObject({ error: 'LOCKED', message: 'O prazo de recursos ainda não terminou.' })
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })

  it('edital inexistente → 404', async () => {
    comoAdmin()
    mockEmitir.mockRejectedValue(new ServiceError('NOT_FOUND', 'Edital não encontrado.'))

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(404)
  })

  it('falha inesperada → 500 sem vazar a causa', async () => {
    comoAdmin()
    mockEmitir.mockRejectedValue(new Error('conexão recusada em 10.0.0.5'))

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('10.0.0.5')
  })

  it.each(['ADMIN', 'SUPER_ADMIN'])('%s → 200 com o PDF e os cabeçalhos', async (role) => {
    comoAdmin(role)
    mockEmitir.mockResolvedValue({
      buffer: Buffer.from('%PDF-fake'),
      filename: 'relatorio_recursos_selecao_edital_2026-09-21.pdf',
      emissao: null,
    })

    const res = await GET(makeReq('?etapa=selecao', { 'x-forwarded-for': '203.0.113.7' }), params())

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toBe(
      'attachment; filename="relatorio_recursos_selecao_edital_2026-09-21.pdf"',
    )
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('%PDF-fake')
    expect(mockEmitir).toHaveBeenCalledWith({
      editalId: 'ed-1',
      etapa: 'selecao',
      userId: 'admin-1',
      ip: '203.0.113.7',
    })
  })
})
