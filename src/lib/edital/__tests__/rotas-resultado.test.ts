import { describe, it, expect } from 'vitest'
import { hrefResultadoRecursos, hrefResultados } from '../rotas-resultado'

describe('hrefResultados', () => {
  it('cada fase tem endereço próprio', () => {
    expect(hrefResultados('festival', false)).toBe('/editais/festival/resultados-preliminar')
    expect(hrefResultados('festival', true)).toBe('/editais/festival/resultados-definitivo')
  })
})

describe('hrefResultadoRecursos', () => {
  it('aponta para a página própria da decisão dos recursos', () => {
    expect(hrefResultadoRecursos('festival')).toBe('/editais/festival/resultados-recurso-avaliacao')
  })
})
