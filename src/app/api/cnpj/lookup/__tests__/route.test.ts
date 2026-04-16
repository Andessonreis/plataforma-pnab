import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST } from '../route'
import { rateLimit } from '@/lib/rate-limit'
import * as lookup from '@/lib/cnpj/lookup'
import type { CnpjLookupResult } from '@/lib/cnpj/types'

const VALID_CNPJ = '11222333000181'
const INVALID_DV = '11222333000180' // DV errado
const VALID_FORMATTED = '11.222.333/0001-81'

const sampleResult: CnpjLookupResult = {
  cnpj: VALID_CNPJ,
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

const mockRateLimit = vi.mocked(rateLimit)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/cnpj/lookup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/cnpj/lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockResolvedValue(null as never)
  })

  it('CNPJ válido + lookup ok → 200 com data normalizada', async () => {
    vi.spyOn(lookup, 'lookupCnpj').mockResolvedValue({
      ok: true,
      data: sampleResult,
      cached: false,
    })

    const res = await POST(makeRequest({ cnpj: VALID_CNPJ }))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.razaoSocial).toBe('EMPRESA EXEMPLO LTDA')
    expect(json.data.fonte).toBe('brasilapi')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('aceita CNPJ com máscara (schema normaliza)', async () => {
    vi.spyOn(lookup, 'lookupCnpj').mockResolvedValue({
      ok: true,
      data: sampleResult,
      cached: true,
    })

    const res = await POST(makeRequest({ cnpj: VALID_FORMATTED }))
    expect(res.status).toBe(200)
    expect(lookup.lookupCnpj).toHaveBeenCalledWith(VALID_CNPJ)
  })

  it('DV inválido → 400 VALIDATION_ERROR sem chamar lookup', async () => {
    const lookupSpy = vi.spyOn(lookup, 'lookupCnpj')

    const res = await POST(makeRequest({ cnpj: INVALID_DV }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('VALIDATION_ERROR')
    expect(lookupSpy).not.toHaveBeenCalled()
  })

  it('comprimento errado → 400', async () => {
    const res = await POST(makeRequest({ cnpj: '123' }))
    expect(res.status).toBe(400)
  })

  it('body sem cnpj → 400', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('lookup NOT_FOUND → 404', async () => {
    vi.spyOn(lookup, 'lookupCnpj').mockResolvedValue({
      ok: false,
      reason: 'NOT_FOUND',
    })

    const res = await POST(makeRequest({ cnpj: VALID_CNPJ }))

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('NOT_FOUND')
    expect(json.message).toMatch(/Receita Federal/i)
  })

  it('lookup UPSTREAM_ERROR → 502 BAD_GATEWAY', async () => {
    vi.spyOn(lookup, 'lookupCnpj').mockResolvedValue({
      ok: false,
      reason: 'UPSTREAM_ERROR',
    })

    const res = await POST(makeRequest({ cnpj: VALID_CNPJ }))

    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.error).toBe('BAD_GATEWAY')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('rate limit bloqueado → 429 sem chamar lookup', async () => {
    const tooMany = NextResponse.json(
      { error: 'TOO_MANY_REQUESTS' },
      { status: 429 },
    )
    mockRateLimit.mockResolvedValue(tooMany as never)
    const lookupSpy = vi.spyOn(lookup, 'lookupCnpj')

    const res = await POST(makeRequest({ cnpj: VALID_CNPJ }))

    expect(res.status).toBe(429)
    expect(lookupSpy).not.toHaveBeenCalled()
  })

  it('resposta sempre inclui X-Request-Id', async () => {
    vi.spyOn(lookup, 'lookupCnpj').mockResolvedValue({
      ok: false,
      reason: 'NOT_FOUND',
    })

    const res = await POST(makeRequest({ cnpj: VALID_CNPJ }))
    expect(res.headers.get('X-Request-Id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })
})
