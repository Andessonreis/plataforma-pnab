import { describe, it, expect, beforeEach, vi } from 'vitest'
import { redis } from '@server/lib/redis'
import * as providers from '../providers'
import { lookupCnpj } from '../lookup'
import type { CnpjLookupResult } from '../types'

const CNPJ = '11222333000181'

const sampleResult: CnpjLookupResult = {
  cnpj: CNPJ,
  razaoSocial: 'EMPRESA EXEMPLO LTDA',
  nomeFantasia: 'Exemplo',
  situacao: 'ATIVA',
  dataSituacao: '2010-05-01',
  cnaePrincipal: { codigo: '6201501', descricao: 'Software' },
  endereco: {
    cep: '44900000',
    logradouro: 'Rua Teste',
    numero: '123',
    complemento: null,
    bairro: 'Centro',
    municipio: 'Irecê',
    uf: 'BA',
  },
  telefone: '7412345678',
  email: null,
  socios: [],
  fonte: 'brasilapi',
}

const mockRedis = vi.mocked(redis)

describe('lookupCnpj', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedis.get.mockResolvedValue(null)
    mockRedis.setex.mockResolvedValue('OK' as never)
  })

  it('cache hit → devolve dados sem chamar providers', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify(sampleResult))
    const brasilSpy = vi.spyOn(providers, 'fetchFromBrasilApi')
    const receitaSpy = vi.spyOn(providers, 'fetchFromReceitaWs')

    const out = await lookupCnpj(CNPJ)

    expect(out).toEqual({ ok: true, data: sampleResult, cached: true })
    expect(brasilSpy).not.toHaveBeenCalled()
    expect(receitaSpy).not.toHaveBeenCalled()
  })

  it('sentinel de NOT_FOUND no cache → devolve NOT_FOUND sem rede', async () => {
    mockRedis.get.mockResolvedValue('__NOT_FOUND__')
    const brasilSpy = vi.spyOn(providers, 'fetchFromBrasilApi')

    const out = await lookupCnpj(CNPJ)

    expect(out).toEqual({ ok: false, reason: 'NOT_FOUND' })
    expect(brasilSpy).not.toHaveBeenCalled()
  })

  it('cache miss + BrasilAPI sucesso → cacheia 7 dias', async () => {
    vi.spyOn(providers, 'fetchFromBrasilApi').mockResolvedValue(sampleResult)

    const out = await lookupCnpj(CNPJ)

    expect(out).toEqual({ ok: true, data: sampleResult, cached: false })
    expect(mockRedis.setex).toHaveBeenCalledWith(
      `cnpj:${CNPJ}`,
      604800,
      JSON.stringify(sampleResult),
    )
  })

  it('BrasilAPI 404 → cacheia sentinel 1h, devolve NOT_FOUND', async () => {
    vi.spyOn(providers, 'fetchFromBrasilApi').mockResolvedValue(null)
    const receitaSpy = vi.spyOn(providers, 'fetchFromReceitaWs')

    const out = await lookupCnpj(CNPJ)

    expect(out).toEqual({ ok: false, reason: 'NOT_FOUND' })
    expect(mockRedis.setex).toHaveBeenCalledWith(`cnpj:${CNPJ}`, 3600, '__NOT_FOUND__')
    expect(receitaSpy).not.toHaveBeenCalled() // 404 não faz fallback
  })

  it('BrasilAPI falha → fallback ReceitaWS sucesso', async () => {
    vi.spyOn(providers, 'fetchFromBrasilApi').mockRejectedValue(
      new providers.CnpjProviderError('timeout', 'brasilapi'),
    )
    const receitaResult: CnpjLookupResult = { ...sampleResult, fonte: 'receitaws' }
    vi.spyOn(providers, 'fetchFromReceitaWs').mockResolvedValue(receitaResult)

    const out = await lookupCnpj(CNPJ)

    expect(out.ok).toBe(true)
    if (out.ok) expect(out.data.fonte).toBe('receitaws')
  })

  it('ambos providers falham → UPSTREAM_ERROR sem cache', async () => {
    vi.spyOn(providers, 'fetchFromBrasilApi').mockRejectedValue(
      new providers.CnpjProviderError('net', 'brasilapi'),
    )
    vi.spyOn(providers, 'fetchFromReceitaWs').mockRejectedValue(
      new providers.CnpjProviderError('net', 'receitaws'),
    )

    const out = await lookupCnpj(CNPJ)

    expect(out).toEqual({ ok: false, reason: 'UPSTREAM_ERROR' })
    expect(mockRedis.setex).not.toHaveBeenCalled()
  })

  it('Redis get falhando → segue fail-open para provider', async () => {
    mockRedis.get.mockRejectedValue(new Error('redis down'))
    vi.spyOn(providers, 'fetchFromBrasilApi').mockResolvedValue(sampleResult)

    const out = await lookupCnpj(CNPJ)
    expect(out.ok).toBe(true)
  })

  it('BrasilAPI falha + ReceitaWS 404 → NOT_FOUND', async () => {
    vi.spyOn(providers, 'fetchFromBrasilApi').mockRejectedValue(
      new providers.CnpjProviderError('5xx', 'brasilapi'),
    )
    vi.spyOn(providers, 'fetchFromReceitaWs').mockResolvedValue(null)

    const out = await lookupCnpj(CNPJ)

    expect(out).toEqual({ ok: false, reason: 'NOT_FOUND' })
  })
})
