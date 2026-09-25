import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { auth } from '@/lib/auth'
import { ServiceError } from '@/lib/services/errors'
import { emitirProjetosContemplados } from '@/lib/services/projetos-contemplados.service'

vi.mock('@/lib/services/projetos-contemplados.service', () => ({ emitirProjetosContemplados: vi.fn() }))

const mockAuth = vi.mocked(auth)
const mockEmitir = vi.mocked(emitirProjetosContemplados)

function makeReq(query = '', headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000/api/admin/editais/ed-1/projetos-contemplados${query}`, { headers })
}

function params(id = 'ed-1') {
  return { params: Promise.resolve({ id }) }
}

function comoUsuario(role: string) {
  mockAuth.mockResolvedValue({ user: { id: 'admin-1', role } } as never)
}

describe('GET /api/admin/editais/[id]/projetos-contemplados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockEmitir.mockResolvedValue({
      buffer: Buffer.from('%PDF-lote'),
      filename: 'projetos-contemplados_festival_2026-09-25.pdf',
      total: 3,
      emissao: null,
    })
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(401)
    expect(mockEmitir).not.toHaveBeenCalled()
  })

  it.each(['PROPONENTE', 'HABILITADOR', 'AVALIADOR', 'COMUNICACAO'])('%s → 403', async (role) => {
    comoUsuario(role)

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(403)
    expect(mockEmitir).not.toHaveBeenCalled()
  })

  it.each(['?anexos=0', '?anexos=true', '?anexos=2'])('anexos inválido (%s) → 400', async (query) => {
    comoUsuario('ADMIN')

    const res = await GET(makeReq(query), params())

    expect(res.status).toBe(400)
    expect((await res.json()).message).toContain('"anexos"')
    expect(mockEmitir).not.toHaveBeenCalled()
  })

  it.each(['ADMIN', 'SUPER_ADMIN'])('%s sem anexos → 200 com o PDF anexado', async (role) => {
    comoUsuario(role)

    const res = await GET(makeReq('', { 'x-forwarded-for': '10.0.0.1' }), params())

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toBe(
      'attachment; filename="projetos-contemplados_festival_2026-09-25.pdf"',
    )
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('%PDF-lote')
    expect(mockEmitir).toHaveBeenCalledWith({
      editalId: 'ed-1', incluirAnexos: false, userId: 'admin-1', role, ip: '10.0.0.1',
    })
  })

  it('anexos=1 liga a mescla dos anexos; anexos vazio vale como ausente', async () => {
    comoUsuario('ADMIN')

    await GET(makeReq('?anexos=1'), params())
    await GET(makeReq('?anexos='), params())

    expect(mockEmitir.mock.calls[0][0].incluirAnexos).toBe(true)
    expect(mockEmitir.mock.calls[1][0].incluirAnexos).toBe(false)
  })

  it('erro de serviço vira a resposta HTTP dele (edital inexistente → 404)', async () => {
    comoUsuario('ADMIN')
    mockEmitir.mockRejectedValue(new ServiceError('NOT_FOUND', 'Edital não encontrado.'))

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(404)
  })

  it('erro inesperado → 500 sem vazar detalhe', async () => {
    comoUsuario('ADMIN')
    mockEmitir.mockRejectedValue(new Error('senha do banco: xyz'))

    const res = await GET(makeReq(), params())

    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('xyz')
  })
})
