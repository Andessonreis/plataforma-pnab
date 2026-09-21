import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { ServiceError } from '@/lib/services/errors'
import { logarComo, makeRequest, mockDivulgar, params, prepararCenarioPadrao } from './route.fixtures'

vi.mock('@/lib/edital-acesso', () => ({ temAcessoEdital: vi.fn() }))
vi.mock('@/lib/services/divulgacao-habilitacao.service', () => ({
  divulgarResultadoHabilitacao: vi.fn(),
}))

describe('POST /api/admin/editais/[id]/habilitacao/divulgar — corpo e respostas do serviço', () => {
  beforeEach(() => {
    prepararCenarioPadrao()
    logarComo('ADMIN')
  })

  it('repassa enviarEmail=false quando o envio é desmarcado', async () => {
    await POST(makeRequest({ enviarEmail: false, totalEsperado: 5 }), params)

    expect(mockDivulgar).toHaveBeenCalledWith(
      expect.objectContaining({ enviarEmail: false, totalEsperado: 5 }),
    )
  })

  it('aceita totalEsperado zero e deixa o serviço recusar a divulgação vazia', async () => {
    const res = await POST(makeRequest({ totalEsperado: 0 }), params)

    expect(res.status).toBe(200)
    expect(mockDivulgar).toHaveBeenCalledWith(expect.objectContaining({ totalEsperado: 0 }))
  })

  it('sem totalEsperado → 400, pois a divulgação exige a quantidade confirmada', async () => {
    const res = await POST(makeRequest({}), params)
    const corpo = await res.json()

    expect(res.status).toBe(400)
    expect(corpo.error).toBe('VALIDATION_ERROR')
    expect(corpo.fieldErrors).toHaveProperty('totalEsperado')
    expect(mockDivulgar).not.toHaveBeenCalled()
  })

  it.each([-1, 1.5, '2', null])('totalEsperado inválido (%j) → 400', async (invalido) => {
    const res = await POST(makeRequest({ totalEsperado: invalido }), params)

    expect(res.status).toBe(400)
    expect(mockDivulgar).not.toHaveBeenCalled()
  })

  it('enviarEmail que não é booleano → 400', async () => {
    const res = await POST(makeRequest({ enviarEmail: 'sim', totalEsperado: 2 }), params)
    const corpo = await res.json()

    expect(res.status).toBe(400)
    expect(corpo.error).toBe('VALIDATION_ERROR')
    expect(mockDivulgar).not.toHaveBeenCalled()
  })

  it('corpo que não é JSON → 400', async () => {
    const res = await POST(makeRequest('isto não é json'), params)

    expect(res.status).toBe(400)
    expect(mockDivulgar).not.toHaveBeenCalled()
  })

  it('lista mudou desde a confirmação → 409 com a mensagem do serviço', async () => {
    const mensagem =
      'A lista mudou desde que a tela foi aberta (esperado 2, agora 3). Atualize a tela e confira antes de divulgar.'
    mockDivulgar.mockRejectedValue(new ServiceError('CONFLICT', mensagem))

    const res = await POST(makeRequest({ totalEsperado: 2 }), params)
    const corpo = await res.json()

    expect(res.status).toBe(409)
    expect(corpo.message).toBe(mensagem)
  })

  it('nada aguardando divulgação → 409 com a mensagem do serviço', async () => {
    mockDivulgar.mockRejectedValue(
      new ServiceError('CONFLICT', 'Não há inscrição decidida aguardando divulgação.'),
    )

    const res = await POST(makeRequest({ totalEsperado: 0 }), params)
    const corpo = await res.json()

    expect(res.status).toBe(409)
    expect(corpo.message).toBe('Não há inscrição decidida aguardando divulgação.')
  })

  it('erro inesperado → 500 sem vazar o motivo', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockDivulgar.mockRejectedValue(new Error('conexão recusada em 10.0.0.5'))

    const res = await POST(makeRequest({ totalEsperado: 2 }), params)
    const corpo = await res.json()

    expect(res.status).toBe(500)
    expect(JSON.stringify(corpo)).not.toContain('10.0.0.5')
  })
})
