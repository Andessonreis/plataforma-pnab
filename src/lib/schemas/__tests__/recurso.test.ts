import { describe, it, expect } from 'vitest'
import { recursoSchema, recursoDecisaoSchema } from '@/lib/schemas/recurso'

describe('recursoSchema', () => {
  it('aceita texto com 10+ caracteres e sem anexos', () => {
    const result = recursoSchema.safeParse({ texto: 'Contesto a avaliação inicial.' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.urlAnexos).toEqual([])
    }
  })

  it('aceita texto + urlAnexos', () => {
    const result = recursoSchema.safeParse({
      texto: 'Contesto a avaliação com fundamentos.',
      urlAnexos: ['https://storage.example/a.pdf', 'https://storage.example/b.pdf'],
    })
    expect(result.success).toBe(true)
  })

  it('rejeita texto com menos de 10 caracteres', () => {
    const result = recursoSchema.safeParse({ texto: 'curto' })
    expect(result.success).toBe(false)
  })

  it('rejeita texto ausente', () => {
    const result = recursoSchema.safeParse({ urlAnexos: [] })
    expect(result.success).toBe(false)
  })

  it('rejeita urlAnexos como string', () => {
    const result = recursoSchema.safeParse({
      texto: 'Texto do recurso válido.',
      urlAnexos: 'https://storage.example/a.pdf',
    })
    expect(result.success).toBe(false)
  })
})

describe('recursoDecisaoSchema', () => {
  it('aceita DEFERIDO com justificativa', () => {
    const result = recursoDecisaoSchema.safeParse({
      decisao: 'DEFERIDO',
      justificativa: 'Documentação retificada confirma elegibilidade.',
    })
    expect(result.success).toBe(true)
  })

  it('aceita INDEFERIDO com justificativa', () => {
    const result = recursoDecisaoSchema.safeParse({
      decisao: 'INDEFERIDO',
      justificativa: 'Argumento não supera a inabilitação.',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita decisão fora do enum', () => {
    const result = recursoDecisaoSchema.safeParse({
      decisao: 'ANALISE',
      justificativa: 'Texto suficiente.',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita justificativa com menos de 5 caracteres', () => {
    const result = recursoDecisaoSchema.safeParse({
      decisao: 'DEFERIDO',
      justificativa: 'ok',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita body sem decisão', () => {
    const result = recursoDecisaoSchema.safeParse({ justificativa: 'Texto suficiente.' })
    expect(result.success).toBe(false)
  })
})
