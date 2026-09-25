import { describe, it, expect } from 'vitest'
import { MENSAGEM_TEMPLATE_INVALIDO, templateDaUrl } from '../template-query'

const BASE = 'http://localhost:3000/api/admin/editais/ed-1/classificacao'

describe('templateDaUrl', () => {
  it.each([['1', 1], ['2', 2]])('?template=%s → versão %i', (valor, versao) => {
    const query = templateDaUrl(`${BASE}?template=${valor}`)

    expect(query.success).toBe(true)
    expect(query.data?.template).toBe(versao)
  })

  it('sem o parâmetro é válido e não escolhe versão', () => {
    const query = templateDaUrl(`${BASE}?etapa=selecao`)

    expect(query.success).toBe(true)
    expect(query.data?.template).toBeUndefined()
  })

  it('convive com os outros parâmetros da query', () => {
    const query = templateDaUrl(`${BASE}?etapa=selecao&template=1`)

    expect(query.data?.template).toBe(1)
  })

  it.each(['0', '3', '01', ' 1 ', '1.0', '0x1', 'v2', ''])('?template=%j → inválido', (valor) => {
    expect(templateDaUrl(`${BASE}?template=${encodeURIComponent(valor)}`).success).toBe(false)
  })

  it('a mensagem de erro cita o parâmetro e as versões aceitas', () => {
    expect(MENSAGEM_TEMPLATE_INVALIDO).toContain('template')
    expect(MENSAGEM_TEMPLATE_INVALIDO).toContain('1 ou 2')
  })
})
