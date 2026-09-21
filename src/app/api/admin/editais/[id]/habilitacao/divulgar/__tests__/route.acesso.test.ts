import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import {
  logarComo,
  makeRequest,
  mockAuth,
  mockDivulgar,
  mockLogAudit,
  mockTemAcesso,
  params,
  prepararCenarioPadrao,
  resultado,
} from './route.fixtures'

vi.mock('@/lib/edital-acesso', () => ({ temAcessoEdital: vi.fn() }))
vi.mock('@/lib/services/divulgacao-habilitacao.service', () => ({
  divulgarResultadoHabilitacao: vi.fn(),
}))

describe('POST /api/admin/editais/[id]/habilitacao/divulgar — acesso', () => {
  beforeEach(prepararCenarioPadrao)

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makeRequest({ totalEsperado: 2 }), params)
    const corpo = await res.json()

    expect(res.status).toBe(401)
    expect(corpo.error).toBe('UNAUTHORIZED')
    expect(mockDivulgar).not.toHaveBeenCalled()
  })

  it.each(['PROPONENTE', 'AVALIADOR', 'COMUNICACAO'])('papel %s → 403', async (role) => {
    logarComo(role)

    const res = await POST(makeRequest({ totalEsperado: 2 }), params)

    expect(res.status).toBe(403)
    expect(mockDivulgar).not.toHaveBeenCalled()
  })

  it('HABILITADOR fora da equipe do edital → 403 e tentativa auditada', async () => {
    logarComo('HABILITADOR')
    mockTemAcesso.mockResolvedValue(false)

    const res = await POST(makeRequest({ totalEsperado: 2 }), params)

    expect(res.status).toBe(403)
    expect(mockTemAcesso).toHaveBeenCalledWith('u1', 'ed-1', 'HABILITADOR')
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'HABILITACAO_ACESSO_NEGADO',
        entity: 'Edital',
        entityId: 'ed-1',
      }),
    )
    expect(mockDivulgar).not.toHaveBeenCalled()
  })

  it('HABILITADOR da equipe → 200', async () => {
    logarComo('HABILITADOR')

    const res = await POST(makeRequest({ totalEsperado: 2 }), params)

    expect(res.status).toBe(200)
    expect(mockDivulgar).toHaveBeenCalledTimes(1)
  })

  it.each(['ADMIN', 'SUPER_ADMIN'])('%s divulga sem passar pela equipe e recebe o resumo', async (role) => {
    logarComo(role)

    const res = await POST(makeRequest({ totalEsperado: 2 }, { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }), params)
    const corpo = await res.json()

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(corpo.data).toEqual(resultado)
    expect(mockTemAcesso).not.toHaveBeenCalled()
    expect(mockDivulgar).toHaveBeenCalledWith({
      editalId: 'ed-1',
      enviarEmail: true,
      totalEsperado: 2,
      userId: 'u1',
      ip: '203.0.113.7',
    })
  })
})
