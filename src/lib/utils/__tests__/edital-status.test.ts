import { describe, it, expect } from 'vitest'
import type { EditalStatus } from '@prisma/client'
import { getStatusDisplay } from '@client/utils/edital-status-ui'
import { OPEN_STATUSES, CLOSED_STATUSES } from '@shared/utils/edital-status'

const ALL_STATUSES: EditalStatus[] = [
  'RASCUNHO', 'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
  'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
  'RESULTADO_FINAL', 'ENCERRADO',
]

describe('getStatusDisplay', () => {
  it('retorna label e badgeVariant para todos os status', () => {
    for (const s of ALL_STATUSES) {
      const display = getStatusDisplay(s)
      expect(display.label).toBeDefined()
      expect(display.label).not.toBe('')
      expect(display.badgeVariant).toBeDefined()
    }
  })

  it('usa success para INSCRICOES_ABERTAS', () => {
    const { label, badgeVariant } = getStatusDisplay('INSCRICOES_ABERTAS')
    expect(label).toBe('Inscrições Abertas')
    expect(badgeVariant).toBe('success')
  })

  it('usa neutral para RASCUNHO e ENCERRADO', () => {
    expect(getStatusDisplay('RASCUNHO').badgeVariant).toBe('neutral')
    expect(getStatusDisplay('ENCERRADO').badgeVariant).toBe('neutral')
  })
})

describe('OPEN_STATUSES / CLOSED_STATUSES', () => {
  it('OPEN contém apenas PUBLICADO e INSCRICOES_ABERTAS', () => {
    expect(OPEN_STATUSES).toEqual(['PUBLICADO', 'INSCRICOES_ABERTAS'])
  })

  it('CLOSED contém o restante dos status públicos (exceto RASCUNHO)', () => {
    expect(CLOSED_STATUSES).toContain('INSCRICOES_ENCERRADAS')
    expect(CLOSED_STATUSES).toContain('HABILITACAO')
    expect(CLOSED_STATUSES).toContain('AVALIACAO')
    expect(CLOSED_STATUSES).toContain('RESULTADO_PRELIMINAR')
    expect(CLOSED_STATUSES).toContain('RECURSO')
    expect(CLOSED_STATUSES).toContain('RESULTADO_FINAL')
    expect(CLOSED_STATUSES).toContain('ENCERRADO')
  })

  it('OPEN e CLOSED não se sobrepõem', () => {
    for (const s of OPEN_STATUSES) {
      expect(CLOSED_STATUSES).not.toContain(s)
    }
  })

  it('OPEN ∪ CLOSED ∪ {RASCUNHO} cobre todos os status', () => {
    const union = new Set<EditalStatus>([...OPEN_STATUSES, ...CLOSED_STATUSES, 'RASCUNHO'])
    for (const s of ALL_STATUSES) {
      expect(union.has(s)).toBe(true)
    }
  })
})
