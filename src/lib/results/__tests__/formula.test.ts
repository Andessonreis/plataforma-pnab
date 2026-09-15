import { describe, it, expect } from 'vitest'
import { validarFormulaCobreTodosBlocos } from '../formula'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'

function criterio(bloco: string, notaMax = 10): CriterioAvaliacao {
  return { criterio: `crit-${bloco}-${Math.random()}`, peso: 1, notaMax, bloco }
}

describe('validarFormulaCobreTodosBlocos', () => {
  it('aceita formula que referencia todos os blocos', () => {
    const criterios = [criterio('Bloco 1'), criterio('Bloco 2')]
    expect(validarFormulaCobreTodosBlocos(criterios, '(B1/10)+(B2/10)')).toBeNull()
  })

  it('rejeita quando um bloco fica de fora — caso real do edital Rede Municipal', () => {
    const criterios = [
      criterio('Bloco 1 — Atuação da entidade cultural'),
      criterio('Bloco 2-I — Efeitos artístico-culturais do projeto'),
      criterio('Bloco 2-II — Execução e Plano de Trabalho'),
      criterio('Bloco 2-III — Abrangência do público beneficiário'),
      criterio('Bloco 3 — Bonificação'),
    ]
    const erro = validarFormulaCobreTodosBlocos(criterios, '((B1+B2)/2)+B3')
    expect(erro).not.toBeNull()
    expect(erro).toContain('Bloco 2-III')
    expect(erro).toContain('Bloco 3')
    expect(erro).toContain('B4')
    expect(erro).toContain('B5')
  })

  it('rejeita quando nenhum criterio tem bloco definido', () => {
    const criterios = [{ criterio: 'A', peso: 1, notaMax: 10 }]
    expect(validarFormulaCobreTodosBlocos(criterios, 'B1')).toContain('bloco definido')
  })

  it('aceita formula com blocos fora de ordem no texto, desde que todos apareçam', () => {
    const criterios = [criterio('Bloco 1'), criterio('Bloco 2'), criterio('Bloco 3')]
    expect(validarFormulaCobreTodosBlocos(criterios, 'B3+B1+B2')).toBeNull()
  })
})
