import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchFromBrasilApi, fetchFromReceitaWs, CnpjProviderError } from '../providers'

const CNPJ = '11222333000181'

const brasilApiPayload = {
  cnpj: CNPJ,
  razao_social: 'EMPRESA EXEMPLO LTDA',
  nome_fantasia: 'Exemplo',
  descricao_situacao_cadastral: 'ATIVA',
  data_situacao_cadastral: '2010-05-01',
  cnae_fiscal: 6201501,
  cnae_fiscal_descricao: 'Desenvolvimento de software',
  cep: '44900000',
  logradouro: 'RUA TESTE',
  numero: '123',
  complemento: 'SALA 1',
  bairro: 'CENTRO',
  municipio: 'IRECE',
  uf: 'BA',
  ddd_telefone_1: '7412345678',
  email: 'contato@exemplo.com',
  qsa: [{ nome_socio: 'JOAO', qualificacao_socio: 'Sócio' }],
}

const receitaWsPayload = {
  status: 'OK',
  cnpj: CNPJ,
  nome: 'EMPRESA EXEMPLO LTDA',
  fantasia: 'Exemplo',
  situacao: 'ATIVA',
  data_situacao: '01/05/2010',
  atividade_principal: [{ code: '62.01-5-01', text: 'Desenvolvimento de software' }],
  cep: '44900000',
  logradouro: 'RUA TESTE',
  numero: '123',
  complemento: 'SALA 1',
  bairro: 'CENTRO',
  municipio: 'IRECE',
  uf: 'BA',
  telefone: '(74) 1234-5678',
  email: 'contato@exemplo.com',
  qsa: [{ nome: 'JOAO', qual: 'Sócio' }],
}

function mockFetchOnce(init: { status: number; body?: unknown; throws?: Error }) {
  const fetchMock = vi.fn(async () => {
    if (init.throws) throw init.throws
    return {
      ok: init.status >= 200 && init.status < 300,
      status: init.status,
      json: async () => init.body,
    } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('fetchFromBrasilApi', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('normaliza resposta de sucesso', async () => {
    mockFetchOnce({ status: 200, body: brasilApiPayload })

    const result = await fetchFromBrasilApi(CNPJ)

    expect(result).not.toBeNull()
    expect(result?.cnpj).toBe(CNPJ)
    expect(result?.razaoSocial).toBe('EMPRESA EXEMPLO LTDA')
    expect(result?.nomeFantasia).toBe('Exemplo')
    expect(result?.situacao).toBe('ATIVA')
    expect(result?.cnaePrincipal).toEqual({
      codigo: '6201501',
      descricao: 'Desenvolvimento de software',
    })
    expect(result?.endereco.municipio).toBe('IRECE')
    expect(result?.endereco.uf).toBe('BA')
    expect(result?.socios).toHaveLength(1)
    expect(result?.socios[0].nome).toBe('JOAO')
    expect(result?.fonte).toBe('brasilapi')
  })

  it('retorna null em 404', async () => {
    mockFetchOnce({ status: 404 })
    const result = await fetchFromBrasilApi(CNPJ)
    expect(result).toBeNull()
  })

  it('lança CnpjProviderError em 5xx', async () => {
    mockFetchOnce({ status: 503 })
    await expect(fetchFromBrasilApi(CNPJ)).rejects.toBeInstanceOf(CnpjProviderError)
  })

  it('lança CnpjProviderError em falha de rede', async () => {
    mockFetchOnce({ status: 0, throws: new Error('ECONNREFUSED') })
    await expect(fetchFromBrasilApi(CNPJ)).rejects.toBeInstanceOf(CnpjProviderError)
  })

  it('trata campos ausentes/nulos sem quebrar', async () => {
    mockFetchOnce({
      status: 200,
      body: {
        cnpj: CNPJ,
        razao_social: 'MINIMA LTDA',
        // sem nome_fantasia, cep, qsa, etc.
      },
    })

    const result = await fetchFromBrasilApi(CNPJ)
    expect(result?.nomeFantasia).toBeNull()
    expect(result?.endereco.cep).toBeNull()
    expect(result?.socios).toEqual([])
    expect(result?.cnaePrincipal).toBeNull()
  })

  it('situacao vazia vira DESCONHECIDA', async () => {
    mockFetchOnce({
      status: 200,
      body: { cnpj: CNPJ, razao_social: 'X LTDA' },
    })
    const result = await fetchFromBrasilApi(CNPJ)
    expect(result?.situacao).toBe('DESCONHECIDA')
  })
})

describe('fetchFromReceitaWs', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('normaliza resposta de sucesso', async () => {
    mockFetchOnce({ status: 200, body: receitaWsPayload })

    const result = await fetchFromReceitaWs(CNPJ)

    expect(result?.razaoSocial).toBe('EMPRESA EXEMPLO LTDA')
    expect(result?.situacao).toBe('ATIVA')
    expect(result?.cnaePrincipal?.codigo).toBe('6201501') // pontuação removida
    expect(result?.socios[0].nome).toBe('JOAO')
    expect(result?.fonte).toBe('receitaws')
  })

  it('retorna null quando status ERROR com mensagem de não encontrado', async () => {
    mockFetchOnce({
      status: 200,
      body: { status: 'ERROR', message: 'CNPJ não encontrado' },
    })
    const result = await fetchFromReceitaWs(CNPJ)
    expect(result).toBeNull()
  })

  it('lança CnpjProviderError em status ERROR sem mensagem de 404', async () => {
    mockFetchOnce({
      status: 200,
      body: { status: 'ERROR', message: 'Too many requests' },
    })
    await expect(fetchFromReceitaWs(CNPJ)).rejects.toBeInstanceOf(CnpjProviderError)
  })

  it('retorna null em HTTP 404', async () => {
    mockFetchOnce({ status: 404 })
    expect(await fetchFromReceitaWs(CNPJ)).toBeNull()
  })

  it('lança CnpjProviderError em 5xx', async () => {
    mockFetchOnce({ status: 502 })
    await expect(fetchFromReceitaWs(CNPJ)).rejects.toBeInstanceOf(CnpjProviderError)
  })
})
