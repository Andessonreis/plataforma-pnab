import { describe, it, expect } from 'vitest'
import {
  createInscricaoSchema,
  updateInscricaoSchema,
  listInscricaoSchema,
} from '@/lib/schemas/inscricao'

describe('createInscricaoSchema', () => {
  it('aceita apenas editalId', () => {
    const result = createInscricaoSchema.safeParse({ editalId: 'edital_123' })
    expect(result.success).toBe(true)
  })

  it('aceita editalId + categoria', () => {
    const result = createInscricaoSchema.safeParse({
      editalId: 'edital_123',
      categoria: 'Audiovisual',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita editalId vazio', () => {
    const result = createInscricaoSchema.safeParse({ editalId: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita body sem editalId', () => {
    const result = createInscricaoSchema.safeParse({ categoria: 'Teatro' })
    expect(result.success).toBe(false)
  })
})

describe('updateInscricaoSchema', () => {
  it('aceita body vazio (todos opcionais)', () => {
    const result = updateInscricaoSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('aceita campos, categoria e orcamento', () => {
    const result = updateInscricaoSchema.safeParse({
      campos: { nome_projeto: 'Ponto de Cultura Viva Irecê' },
      categoria: 'Cultura Popular',
      orcamento: { total: 90000 },
    })
    expect(result.success).toBe(true)
  })

  it('rejeita campos como array', () => {
    const result = updateInscricaoSchema.safeParse({ campos: [] })
    expect(result.success).toBe(false)
  })

  it('rejeita orcamento como string', () => {
    const result = updateInscricaoSchema.safeParse({ orcamento: 'R$ 90.000' })
    expect(result.success).toBe(false)
  })
})

describe('listInscricaoSchema', () => {
  it('aplica defaults (page=1, pageSize=10)', () => {
    const result = listInscricaoSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(10)
    }
  })

  it('coage strings para número', () => {
    const result = listInscricaoSchema.safeParse({ page: '2', pageSize: '25' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('rejeita pageSize acima de 50', () => {
    const result = listInscricaoSchema.safeParse({ pageSize: '100' })
    expect(result.success).toBe(false)
  })

  it('rejeita page zero', () => {
    const result = listInscricaoSchema.safeParse({ page: '0' })
    expect(result.success).toBe(false)
  })
})
