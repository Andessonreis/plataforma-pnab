import { describe, it, expect } from 'vitest'
import {
  editalSchema,
  editalQuerySchema,
  editalAcessivelSchema,
  cronogramaItemSchema,
} from '@/lib/schemas/edital'

describe('cronogramaItemSchema', () => {
  it('aceita item de fase válido', () => {
    const result = cronogramaItemSchema.safeParse({
      tipo: 'fase',
      fase: 'INSCRICOES_ABERTAS',
      dataHora: '2026-05-01T09:00',
    })
    expect(result.success).toBe(true)
  })

  it('aceita item custom com label', () => {
    const result = cronogramaItemSchema.safeParse({
      tipo: 'custom',
      label: 'Reunião de esclarecimento',
      dataHora: '2026-04-20T14:00',
    })
    expect(result.success).toBe(true)
  })

  it('aceita formato legacy (sem tipo)', () => {
    const result = cronogramaItemSchema.safeParse({
      label: 'Fase antiga',
      dataHora: '2026-04-01T09:00',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita fase com enum inválido', () => {
    const result = cronogramaItemSchema.safeParse({
      tipo: 'fase',
      fase: 'INEXISTENTE',
      dataHora: '2026-04-01T09:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita custom com label vazio', () => {
    const result = cronogramaItemSchema.safeParse({
      tipo: 'custom',
      label: '',
      dataHora: '2026-04-01T09:00',
    })
    expect(result.success).toBe(false)
  })
})

describe('cronogramaItemSchema — botões do marco', () => {
  const marco = {
    tipo: 'custom',
    label: 'Publicação dos Projetos Selecionados',
    dataHora: '2026-09-22T00:00:00',
    acao: 'PUBLICACAO_RESULTADO_FINAL',
    link: '/editais/festival/resultados',
    diarioOficialUrl: 'https://procede.api.br/pdfGateway/irece/publicacoes/Ed%202935.pdf',
  }

  it('preserva link e Diário Oficial ao salvar o marco', () => {
    const result = cronogramaItemSchema.parse(marco)
    expect(result).toMatchObject({ link: marco.link, diarioOficialUrl: marco.diarioOficialUrl })
  })

  it.each([
    ['link fora do portal', { link: 'https://outro.site/x' }],
    ['link sem barra inicial', { link: 'javascript:alert(1)' }],
    ['link de protocolo relativo', { link: '//outro.site/x' }],
    ['Diário Oficial que não é https', { diarioOficialUrl: 'javascript:alert(1)' }],
    ['Diário Oficial em http', { diarioOficialUrl: 'http://gateway/Ed 2935.pdf' }],
    ['Diário Oficial que não é endereço', { diarioOficialUrl: 'edição 2935' }],
  ])('descarta %s sem tirar o tipo nem a ação do marco', (_nome, invalido) => {
    const result = cronogramaItemSchema.parse({ ...marco, ...invalido })
    expect(result).toMatchObject({ tipo: 'custom', acao: 'PUBLICACAO_RESULTADO_FINAL' })
    // O que chega ao banco é o JSON: chave com valor indefinido não é gravada.
    expect(JSON.parse(JSON.stringify(result))).not.toHaveProperty(Object.keys(invalido)[0])
  })
})

describe('editalSchema', () => {
  const valido = {
    titulo: 'Chamamento Público Cultura Viva',
    ano: 2026,
    valorTotal: 90000,
    categorias: [],
    status: 'PUBLICADO' as const,
    cronograma: [],
    camposFormulario: [],
  }

  it('aceita edital válido', () => {
    const result = editalSchema.safeParse(valido)
    expect(result.success).toBe(true)
  })

  it('aplica defaults para status, categorias, cronograma e camposFormulario', () => {
    const result = editalSchema.safeParse({ titulo: 'Edital X', ano: 2026 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('RASCUNHO')
      expect(result.data.categorias).toEqual([])
      expect(result.data.cronograma).toEqual([])
      expect(result.data.camposFormulario).toEqual([])
    }
  })

  it('rejeita título com menos de 3 caracteres', () => {
    const result = editalSchema.safeParse({ ...valido, titulo: 'ab' })
    expect(result.success).toBe(false)
  })

  it('rejeita ano antes de 2020', () => {
    const result = editalSchema.safeParse({ ...valido, ano: 2019 })
    expect(result.success).toBe(false)
  })

  it('rejeita ano depois de 2099', () => {
    const result = editalSchema.safeParse({ ...valido, ano: 2100 })
    expect(result.success).toBe(false)
  })

  it('rejeita ano não inteiro', () => {
    const result = editalSchema.safeParse({ ...valido, ano: 2026.5 })
    expect(result.success).toBe(false)
  })

  it('rejeita status fora do enum', () => {
    const result = editalSchema.safeParse({ ...valido, status: 'DESCONHECIDO' })
    expect(result.success).toBe(false)
  })

  it('aceita valorTotal null e resumo null', () => {
    const result = editalSchema.safeParse({
      ...valido,
      valorTotal: null,
      resumo: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita vagasContemplados abaixo de 1', () => {
    const result = editalSchema.safeParse({ ...valido, vagasContemplados: 0 })
    expect(result.success).toBe(false)
  })

  it('rejeita vagasSuplentes negativo', () => {
    const result = editalSchema.safeParse({ ...valido, vagasSuplentes: -1 })
    expect(result.success).toBe(false)
  })
})

describe('editalQuerySchema', () => {
  it('aplica defaults de paginação', () => {
    const result = editalQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(12)
    }
  })

  it('coage strings de query string para número', () => {
    const result = editalQuerySchema.safeParse({ page: '3', pageSize: '25' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('rejeita pageSize acima do limite de 50', () => {
    const result = editalQuerySchema.safeParse({ pageSize: '100' })
    expect(result.success).toBe(false)
  })

  it('rejeita page abaixo de 1', () => {
    const result = editalQuerySchema.safeParse({ page: '0' })
    expect(result.success).toBe(false)
  })
})

describe('editalAcessivelSchema', () => {
  it('aceita conteúdo válido', () => {
    const result = editalAcessivelSchema.safeParse({ conteudoAcessivel: '<p>Texto</p>' })
    expect(result.success).toBe(true)
  })

  it('rejeita conteúdo vazio', () => {
    const result = editalAcessivelSchema.safeParse({ conteudoAcessivel: '' })
    expect(result.success).toBe(false)
  })
})
