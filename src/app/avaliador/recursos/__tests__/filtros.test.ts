import { describe, it, expect } from 'vitest'
import { WHERE_RECURSO_ATIVO, classificarRecurso, whereInscricoesComRecurso } from '../filtros'

describe('fila de recursos do avaliador', () => {
  it('só considera ativo o recurso sem decisão consolidada', () => {
    expect(WHERE_RECURSO_ATIVO).toEqual({ decisao: null })
  })

  it('escopa as inscrições ao avaliador, aos editais da equipe e a recurso ativo', () => {
    expect(whereInscricoesComRecurso('aval-1', ['ed-1', 'ed-2'])).toEqual({
      avaliacoes: { some: { avaliadorId: 'aval-1' } },
      recursos: { some: { decisao: null } },
      editalId: { in: ['ed-1', 'ed-2'] },
    })
  })

  it('separa o que aguarda resposta do avaliador do que ele já respondeu', () => {
    expect(classificarRecurso({ respostas: [] })).toBe('pendentes')
    expect(classificarRecurso({ respostas: [{ id: 'resp-1' }] })).toBe('respondidos')
  })
})
