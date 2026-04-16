import { describe, it, expect } from 'vitest'
import { habilitacaoSchema } from '@/lib/schemas/habilitacao'

describe('habilitacaoSchema', () => {
  it('aceita HABILITADA sem motivo', () => {
    const result = habilitacaoSchema.safeParse({ status: 'HABILITADA' })
    expect(result.success).toBe(true)
  })

  it('aceita HABILITADA com motivo opcional', () => {
    const result = habilitacaoSchema.safeParse({
      status: 'HABILITADA',
      motivo: 'Documentação completa.',
    })
    expect(result.success).toBe(true)
  })

  it('aceita INABILITADA com motivo preenchido', () => {
    const result = habilitacaoSchema.safeParse({
      status: 'INABILITADA',
      motivo: 'Faltou comprovante de regularidade fiscal.',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita INABILITADA sem motivo', () => {
    const result = habilitacaoSchema.safeParse({ status: 'INABILITADA' })
    expect(result.success).toBe(false)
  })

  it('rejeita INABILITADA com motivo vazio', () => {
    const result = habilitacaoSchema.safeParse({ status: 'INABILITADA', motivo: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita INABILITADA com motivo só espaços', () => {
    const result = habilitacaoSchema.safeParse({ status: 'INABILITADA', motivo: '   ' })
    expect(result.success).toBe(false)
  })

  it('aponta erro no campo motivo quando INABILITADA sem razão', () => {
    const result = habilitacaoSchema.safeParse({ status: 'INABILITADA' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('motivo'))
      expect(err).toBeDefined()
    }
  })

  it('rejeita status fora do enum', () => {
    const result = habilitacaoSchema.safeParse({ status: 'PENDENTE' })
    expect(result.success).toBe(false)
  })

  it('rejeita status ausente', () => {
    const result = habilitacaoSchema.safeParse({ motivo: 'x' })
    expect(result.success).toBe(false)
  })
})
