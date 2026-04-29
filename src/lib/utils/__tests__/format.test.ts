import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'
import {
  TZ_BR,
  formatCurrency,
  parseBrazilDateTime,
  formatDate,
  formatDateTime,
  formatTelefoneBR,
  unmaskTelefone,
} from '@/lib/utils/format'

describe('TZ_BR', () => {
  it('aponta para America/Sao_Paulo', () => {
    expect(TZ_BR).toBe('America/Sao_Paulo')
  })
})

describe('formatCurrency', () => {
  it('formata número inteiro', () => {
    expect(formatCurrency(90000)).toMatch(/R\$\s?90\.000,00/)
  })

  it('formata número com decimais', () => {
    expect(formatCurrency(1234.56)).toMatch(/R\$\s?1\.234,56/)
  })

  it('formata zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s?0,00/)
  })

  it('formata string numérica', () => {
    expect(formatCurrency('5000')).toMatch(/R\$\s?5\.000,00/)
  })

  it('formata Prisma Decimal', () => {
    expect(formatCurrency(new Prisma.Decimal('2500.50'))).toMatch(/R\$\s?2\.500,50/)
  })

  it('retorna traço para null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('retorna traço para undefined', () => {
    expect(formatCurrency(undefined)).toBe('—')
  })

  it('retorna traço para string não numérica', () => {
    expect(formatCurrency('abc')).toBe('—')
  })
})

describe('parseBrazilDateTime', () => {
  it('retorna Date inalterado quando recebe Date', () => {
    const d = new Date('2026-04-15T12:00:00Z')
    expect(parseBrazilDateTime(d)).toBe(d)
  })

  it('interpreta string nua como BRT (UTC-03)', () => {
    // "2026-04-15 09:00" no horário de Brasília = 12:00 UTC
    const d = parseBrazilDateTime('2026-04-15T09:00')
    expect(d.toISOString()).toBe('2026-04-15T12:00:00.000Z')
  })

  it('respeita timezone Z explícito', () => {
    const d = parseBrazilDateTime('2026-04-15T09:00:00Z')
    expect(d.toISOString()).toBe('2026-04-15T09:00:00.000Z')
  })

  it('respeita offset explícito +00:00', () => {
    const d = parseBrazilDateTime('2026-04-15T09:00:00+00:00')
    expect(d.toISOString()).toBe('2026-04-15T09:00:00.000Z')
  })

  it('respeita offset explícito -05:00', () => {
    const d = parseBrazilDateTime('2026-04-15T09:00:00-05:00')
    expect(d.toISOString()).toBe('2026-04-15T14:00:00.000Z')
  })
})

describe('formatDate', () => {
  it('formata Date no fuso BRT', () => {
    // 2026-04-15 03:00 UTC = 2026-04-15 00:00 BRT → 15/04/2026
    expect(formatDate(new Date('2026-04-15T03:00:00Z'))).toBe('15/04/2026')
  })

  it('formata string nua como data BRT', () => {
    expect(formatDate('2026-04-15T09:00')).toBe('15/04/2026')
  })

  it('retorna traço para null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('retorna traço para undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('retorna traço para string inválida', () => {
    expect(formatDate('não-é-data')).toBe('—')
  })

  it('mantém o dia mesmo quando a hora UTC cruza meia-noite em Brasília', () => {
    // 2026-04-16 02:00 UTC = 2026-04-15 23:00 BRT → 15/04/2026
    expect(formatDate(new Date('2026-04-16T02:00:00Z'))).toBe('15/04/2026')
  })
})

describe('formatDateTime', () => {
  it('formata com data e hora em BRT', () => {
    // 2026-04-15 12:30 UTC = 2026-04-15 09:30 BRT
    const result = formatDateTime(new Date('2026-04-15T12:30:00Z'))
    expect(result).toContain('15/04/2026')
    expect(result).toContain('09:30')
  })

  it('formata string nua preservando a hora digitada', () => {
    const result = formatDateTime('2026-04-15T14:45')
    expect(result).toContain('15/04/2026')
    expect(result).toContain('14:45')
  })

  it('retorna traço para null', () => {
    expect(formatDateTime(null)).toBe('—')
  })

  it('retorna traço para string inválida', () => {
    expect(formatDateTime('abc')).toBe('—')
  })
})

describe('unmaskTelefone', () => {
  it('remove tudo que não for dígito', () => {
    expect(unmaskTelefone('(77) 99999-0000')).toBe('77999990000')
  })

  it('limita a 11 dígitos (ignora extras)', () => {
    expect(unmaskTelefone('77999990000123')).toBe('77999990000')
  })

  it('string vazia retorna vazio', () => {
    expect(unmaskTelefone('')).toBe('')
  })

  it('aceita só letras retorna vazio', () => {
    expect(unmaskTelefone('abc')).toBe('')
  })
})

describe('formatTelefoneBR', () => {
  it('formata celular completo (11 dígitos)', () => {
    expect(formatTelefoneBR('77999990000')).toBe('(77) 99999-0000')
  })

  it('formata fixo (10 dígitos)', () => {
    expect(formatTelefoneBR('7733330000')).toBe('(77) 3333-0000')
  })

  it('formata input parcial (digitação em curso)', () => {
    expect(formatTelefoneBR('77')).toBe('(77')
    expect(formatTelefoneBR('779')).toBe('(77) 9')
    expect(formatTelefoneBR('7799999')).toBe('(77) 9999-9')
  })

  it('ignora tudo após o 11º dígito', () => {
    expect(formatTelefoneBR('779999900001234')).toBe('(77) 99999-0000')
  })

  it('ignora caracteres não numéricos', () => {
    expect(formatTelefoneBR('(77) 99999-0000')).toBe('(77) 99999-0000')
    expect(formatTelefoneBR('77 abc 99999 def 0000')).toBe('(77) 99999-0000')
  })

  it('string vazia retorna vazio', () => {
    expect(formatTelefoneBR('')).toBe('')
  })
})
