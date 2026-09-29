import { describe, expect, it } from 'vitest'
import { faseDoRecurso, situacaoRecurso } from '../recurso-proponente'

const CRONOGRAMA = [
  { tipo: 'custom', label: 'Período para recursos — seleção', acao: 'RECURSO_RESULTADO_FINAL_JANELA', dataHora: '2026-09-29T00:00:00', fimEm: '2026-09-30T23:59:00' },
  { tipo: 'custom', label: 'Período para recursos — habilitação', acao: 'RECURSO_HABILITACAO_JANELA', dataHora: '2026-09-16T00:00:00', fimEm: '2026-09-18T23:59:00' },
]
const DURANTE = new Date('2026-09-29T15:00:00-03:00')

describe('faseDoRecurso', () => {
  it('suplente e não contemplada recorrem da seleção; contemplada não recorre', () => {
    expect(faseDoRecurso('SUPLENTE')).toBe('RESULTADO_FINAL')
    expect(faseDoRecurso('NAO_CONTEMPLADA')).toBe('RESULTADO_FINAL')
    expect(faseDoRecurso('CONTEMPLADA')).toBeNull()
  })
})

describe('situacaoRecurso', () => {
  it('suplente com a janela da seleção aberta pode enviar', () => {
    expect(situacaoRecurso('SUPLENTE', CRONOGRAMA, [], DURANTE)).toMatchObject({ fase: 'RESULTADO_FINAL', aberto: true })
  })

  it('inabilitada fica com o prazo da habilitação, já encerrado', () => {
    expect(situacaoRecurso('INABILITADA', CRONOGRAMA, [], DURANTE)).toMatchObject({ fase: 'HABILITACAO', aberto: false })
  })

  it('antes da abertura o formulário não é oferecido', () => {
    const vespera = new Date('2026-09-28T20:00:00-03:00')
    expect(situacaoRecurso('SUPLENTE', CRONOGRAMA, [], vespera)?.aberto).toBe(false)
  })

  it('recurso já protocolado na fase encerra a oferta', () => {
    expect(situacaoRecurso('SUPLENTE', CRONOGRAMA, ['RESULTADO_FINAL'], DURANTE)).toBeNull()
  })
})
