import { describe, it, expect } from 'vitest'
import { notaFinalRevisada, resumoAvaliacoes } from '../resumo'

const REVISADA = {
  revisadoEm: '2026-09-25T19:04:10.769Z',
  notasAnteriores: [{ criterio: 'B) Coerência', nota: 12 }],
  notaTotalAnterior: 90,
}

/** PNAB-2026-0139: a avaliação da Karla foi de 90 para 98; as outras duas não mudaram. */
const AVALIACOES_0139 = [
  { finalizada: true, notaTotal: '98.00', revisaoRecurso: REVISADA },
  { finalizada: true, notaTotal: '99.00', revisaoRecurso: null },
  { finalizada: true, notaTotal: '88.00', revisaoRecurso: null },
]

describe('resumoAvaliacoes', () => {
  it('traz a média de antes só quando a revisão a mudou', () => {
    expect(resumoAvaliacoes(AVALIACOES_0139)).toEqual({
      atribuidos: 3, finalizadas: 3, media: '95.00', mediaAnterior: '92.33',
    })
  })

  it('sem revisão não há média anterior', () => {
    const semRevisao = AVALIACOES_0139.map((a) => ({ ...a, revisaoRecurso: null }))

    expect(resumoAvaliacoes(semRevisao).mediaAnterior).toBeNull()
  })

  it('avaliação não finalizada fica fora da média', () => {
    const resumo = resumoAvaliacoes([...AVALIACOES_0139, { finalizada: false, notaTotal: null }])

    expect(resumo).toMatchObject({ atribuidos: 4, finalizadas: 3, media: '95.00' })
  })
})

describe('notaFinalRevisada', () => {
  it('nota gravada ainda na média de antes: mostra a de antes riscada e a nova média', () => {
    expect(notaFinalRevisada(92.33, AVALIACOES_0139)).toEqual({ anterior: 92.33, atual: 95 })
  })

  it('nota gravada já na média nova (resultado aplicado): o antes vem das avaliações', () => {
    const revisao = notaFinalRevisada(95, AVALIACOES_0139)

    expect(revisao?.atual).toBe(95)
    expect(revisao?.anterior).toBeCloseTo(92.33, 2)
  })

  it('sem revisão ou sem mudança de média devolve null', () => {
    expect(notaFinalRevisada(92.33, AVALIACOES_0139.map((a) => ({ ...a, revisaoRecurso: null })))).toBeNull()

    const revisaoQueNaoMudou = { ...REVISADA, notaTotalAnterior: 98 }
    expect(notaFinalRevisada(95, [{ ...AVALIACOES_0139[0], revisaoRecurso: revisaoQueNaoMudou }, ...AVALIACOES_0139.slice(1)]))
      .toBeNull()
  })

  it('nota gravada que não bate com nenhum dos lados (ex.: bonificação somada) não é marcada', () => {
    expect(notaFinalRevisada(97.33, AVALIACOES_0139)).toBeNull()
  })

  it('sem nenhuma avaliação finalizada devolve null', () => {
    expect(notaFinalRevisada(90, [{ finalizada: false, notaTotal: null }])).toBeNull()
  })
})
