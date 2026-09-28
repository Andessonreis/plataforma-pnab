import { describe, it, expect } from 'vitest'
import { TEXTOS_POR_SITUACAO } from '../lista-classificacao'

describe('rodapé da classificação', () => {
  it.each(['CONSOLIDADA', 'FINAL'] as const)('%s cita a bonificação só quando a lista a mostra', (situacao) => {
    const { rodape } = TEXTOS_POR_SITUACAO[situacao]

    expect(rodape(true)).toContain('e a bonificação prevista no edital.')
    expect(rodape(false)).not.toContain('bonificação')
    expect(rodape(false)).toMatch(/comissão avaliadora\.$/)
  })

  it('a prévia não fala em bonificação e segue igual nos dois casos', () => {
    const { rodape } = TEXTOS_POR_SITUACAO.PREVIA

    expect(rodape(true)).toBe(rodape(false))
    expect(rodape(true)).not.toContain('bonificação')
  })
})
