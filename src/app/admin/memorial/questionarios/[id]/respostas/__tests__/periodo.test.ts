import { describe, it, expect } from 'vitest'
import { diaAtras, intervaloDoPeriodo, periodoSchema } from '../periodo'

describe('período das respostas', () => {
  it('"até" inclui o dia inteiro no horário de Irecê', () => {
    expect(intervaloDoPeriodo({ de: '2026-10-01', ate: '2026-10-05' })).toEqual({
      gte: new Date('2026-10-01T03:00:00Z'),
      lt: new Date('2026-10-06T03:00:00Z'),
    })
  })

  it('datas invertidas são postas na ordem', () => {
    expect(intervaloDoPeriodo({ de: '2026-10-05', ate: '2026-10-01' }).gte).toEqual(new Date('2026-10-01T03:00:00Z'))
  })

  it('sem datas não filtra', () => {
    expect(intervaloDoPeriodo({})).toEqual({})
  })

  it('ignora data mal formada vinda do endereço', () => {
    expect(periodoSchema.parse({ de: '01/10/2026', ate: '2026-10-05' })).toEqual({ de: undefined, ate: '2026-10-05' })
  })

  it('calcula o dia de N dias atrás no fuso de Irecê', () => {
    expect(diaAtras(7, new Date('2026-10-09T02:00:00Z'))).toBe('2026-10-01')
  })
})
