import { describe, it, expect } from 'vitest'
import {
  comTemplate, parseTemplate, templateBodySchema, templateQuerySchema, templateSchema,
  NOME_DO_TEMPLATE, TEMPLATE_PADRAO,
} from '../template'

describe('TEMPLATE_PADRAO', () => {
  it('o padrão do sistema é a versão 2', () => {
    expect(TEMPLATE_PADRAO).toBe(2)
  })

  it('cada versão tem nome próprio, sem depender de cor nem de número solto', () => {
    expect(NOME_DO_TEMPLATE[1]).toBe('Versão 1 (layout anterior)')
    expect(NOME_DO_TEMPLATE[2]).toBe('Versão 2 (padrão Diário Oficial, com QR)')
  })
})

describe('parseTemplate', () => {
  it('aceita número e texto', () => {
    expect(parseTemplate(1)).toBe(1)
    expect(parseTemplate('1')).toBe(1)
    expect(parseTemplate(2)).toBe(2)
    expect(parseTemplate('2')).toBe(2)
  })

  it('recusa versão inexistente', () => {
    expect(parseTemplate(3)).toBeNull()
    expect(parseTemplate(0)).toBeNull()
    expect(parseTemplate('v1')).toBeNull()
  })

  it('recusa ausência de valor', () => {
    expect(parseTemplate(undefined)).toBeNull()
    expect(parseTemplate(null)).toBeNull()
    expect(parseTemplate('')).toBeNull()
  })

  it('não aceita texto que só parece 1 ou 2', () => {
    for (const valor of ['1.0', ' 1 ', '0x1', '01', '+1', '2 ']) {
      expect(parseTemplate(valor)).toBeNull()
    }
  })

  it('não aceita número quebrado nem estrutura', () => {
    for (const valor of [1.5, NaN, [], [1], {}, true]) {
      expect(parseTemplate(valor)).toBeNull()
    }
  })
})

describe('templateSchema', () => {
  it('converte a query para número', () => {
    expect(templateSchema.parse('1')).toBe(1)
    expect(templateSchema.parse('2')).toBe(2)
  })

  it('rejeita o que o parseTemplate rejeita — a rota responde 400', () => {
    for (const valor of ['3', '1.0', ' 1 ', '0x1', '01', 1.5, null]) {
      expect(templateSchema.safeParse(valor).success).toBe(false)
    }
  })

  it('template ausente na query é válido — quem chama cai na preferência', () => {
    expect(templateQuerySchema.parse({})).toEqual({ template: undefined })
    expect(templateQuerySchema.parse({ template: '1' })).toEqual({ template: 1 })
  })
})

describe('templateBodySchema', () => {
  it('aceita o número que o corpo JSON manda', () => {
    expect(templateBodySchema.parse(1)).toBe(1)
    expect(templateBodySchema.parse(2)).toBe(2)
  })

  it('tolera o texto de formulário serializado', () => {
    expect(templateBodySchema.parse('1')).toBe(1)
    expect(templateBodySchema.parse('2')).toBe(2)
  })

  it('recusa qualquer outra coisa', () => {
    for (const valor of [3, 0, 'x', null, true, '1.0', ' 1 ', '0x1', '01', 1.5, NaN, [], {}]) {
      expect(templateBodySchema.safeParse(valor).success).toBe(false)
    }
  })
})

describe('comTemplate', () => {
  it('acrescenta o parâmetro a uma URL sem query', () => {
    expect(comTemplate('/api/admin/editais/ed-1/listas', 1))
      .toBe('/api/admin/editais/ed-1/listas?template=1')
  })

  it('preserva a query existente', () => {
    expect(comTemplate('/api/listas?status=HABILITADA&categoria=Teatro', 2))
      .toBe('/api/listas?status=HABILITADA&categoria=Teatro&template=2')
  })

  it('troca o template já presente em vez de duplicar', () => {
    expect(comTemplate('/api/listas?template=2&status=ENVIADA', 1))
      .toBe('/api/listas?template=1&status=ENVIADA')
  })

  it('preserva o fragmento', () => {
    expect(comTemplate('/admin/editais/ed-1?aba=listas#documentos', 1))
      .toBe('/admin/editais/ed-1?aba=listas&template=1#documentos')
  })

  it('funciona com URL absoluta', () => {
    expect(comTemplate('https://portal.exemplo/api/listas', 2))
      .toBe('https://portal.exemplo/api/listas?template=2')
  })
})
