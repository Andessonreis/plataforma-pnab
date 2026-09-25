import { describe, it, expect } from 'vitest'
import { janelaDoRecurso } from '../prazo-recurso'

const ACAO = 'RECURSO_RESULTADO_FINAL_JANELA' as const

const JANELA = { tipo: 'custom', label: 'Período para recursos', dataHora: '2026-09-23T00:00:00', fimEm: '2026-09-24T23:59:00', acao: ACAO }

describe('janelaDoRecurso', () => {
  it('devolve o período cadastrado para a ação', () => {
    const janela = janelaDoRecurso([JANELA], ACAO)

    expect(janela?.inicio.toISOString()).toBe('2026-09-23T03:00:00.000Z')
    expect(janela?.fim?.toISOString()).toBe('2026-09-25T02:59:00.000Z')
  })

  it('marco pontual da mesma ação, mais recente, não oculta a janela real', () => {
    const janela = janelaDoRecurso(
      [JANELA, { tipo: 'custom', label: 'Aviso', dataHora: '2026-09-26T00:00:00', acao: ACAO }],
      ACAO,
    )

    expect(janela?.fim?.toISOString()).toBe('2026-09-25T02:59:00.000Z')
  })

  it.each([[[]], [null], [undefined], [[{ tipo: 'custom', label: 'Outro', dataHora: '2026-09-23T00:00:00', fimEm: '2026-09-24T23:59:00', acao: 'RECURSO_EDITAL_JANELA' }]]])(
    'sem janela cadastrada para a ação devolve null (%j)',
    (cronograma) => {
      expect(janelaDoRecurso(cronograma, ACAO)).toBeNull()
    },
  )
})
