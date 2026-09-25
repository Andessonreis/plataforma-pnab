import { describe, it, expect } from 'vitest'
import {
  lerRevisaoRecurso, mediaAnterior, mediaMudou, mesmaNota, notaAnteriorDoCriterio, type RevisaoRecurso,
} from '../revisao-recurso'

const REVISAO: RevisaoRecurso = {
  revisadoEm: '2026-09-25T19:04:00.000Z',
  notasAnteriores: [{ criterio: 'A) Qualidade', nota: 28 }, { criterio: 'B) Coerência', nota: 12 }],
  notaTotalAnterior: 90,
}

describe('lerRevisaoRecurso', () => {
  it('lê o que o banco guardou', () => {
    expect(lerRevisaoRecurso(REVISAO)).toEqual(REVISAO)
  })

  it('descarta nota malformada mas mantém as boas', () => {
    const lida = lerRevisaoRecurso({ ...REVISAO, notasAnteriores: [...REVISAO.notasAnteriores, { criterio: 'X' }, null] })
    expect(lida?.notasAnteriores).toHaveLength(2)
  })

  it.each([null, undefined, 'x', 3, {}, { revisadoEm: 'a', notasAnteriores: [] }, { ...REVISAO, notaTotalAnterior: 'x' }])(
    'ignora valor sem a forma esperada (%j)',
    (bruto) => expect(lerRevisaoRecurso(bruto)).toBeNull(),
  )
})

describe('notaAnteriorDoCriterio', () => {
  it('devolve o valor antigo só quando o critério mudou', () => {
    expect(notaAnteriorDoCriterio(REVISAO, 'B) Coerência', 20)).toBe(12)
    expect(notaAnteriorDoCriterio(REVISAO, 'A) Qualidade', 28)).toBeNull()
  })

  it('não inventa valor sem revisão, sem nota atual ou para critério desconhecido', () => {
    expect(notaAnteriorDoCriterio(null, 'B) Coerência', 20)).toBeNull()
    expect(notaAnteriorDoCriterio(REVISAO, 'B) Coerência', undefined)).toBeNull()
    expect(notaAnteriorDoCriterio(REVISAO, 'Z) Outro', 5)).toBeNull()
  })
})

describe('mediaAnterior', () => {
  it('usa o valor anterior de quem foi revisado e o atual dos demais', () => {
    const media = mediaAnterior([
      { pontuacao: 98, anterior: 90 },
      { pontuacao: 99, anterior: null },
      { pontuacao: 88, anterior: null },
    ])
    expect(media?.toFixed(2)).toBe('92.33')
  })

  it('sem nenhuma revisão não há média anterior', () => {
    expect(mediaAnterior([{ pontuacao: 90, anterior: null }])).toBeNull()
  })

  it('não calcula com pontuação faltando', () => {
    expect(mediaAnterior([{ pontuacao: null, anterior: null }, { pontuacao: 98, anterior: 90 }])).toBeNull()
  })
})

describe('mesmaNota e mediaMudou', () => {
  it('a nota gravada com duas casas vale a média calculada na hora', () => {
    expect(mesmaNota(92.33, 277 / 3)).toBe(true)
    expect(mesmaNota(92.33, 95)).toBe(false)
  })

  it('só há mudança quando existem os dois valores e eles diferem', () => {
    expect(mediaMudou(92.33, 95)).toBe(true)
    expect(mediaMudou(95, 95)).toBe(false)
    expect(mediaMudou(null, 95)).toBe(false)
    expect(mediaMudou(92.33, null)).toBe(false)
  })
})
