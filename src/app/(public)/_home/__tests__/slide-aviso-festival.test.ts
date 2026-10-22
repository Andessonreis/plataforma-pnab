import { describe, it, expect } from 'vitest'
import { AVISO_FESTIVAL_EXPIRA_EM } from '../slide-aviso-festival'

describe('aviso das datas do Festival', () => {
  it('vale até o fim do dia 27/02/2027 em Brasília e some a partir da meia-noite', () => {
    expect(AVISO_FESTIVAL_EXPIRA_EM.toISOString()).toBe('2027-02-28T02:59:59.000Z')
    expect(new Date('2027-02-27T23:59:00-03:00') <= AVISO_FESTIVAL_EXPIRA_EM).toBe(true)
    expect(new Date('2027-02-28T00:00:00-03:00') <= AVISO_FESTIVAL_EXPIRA_EM).toBe(false)
  })
})
