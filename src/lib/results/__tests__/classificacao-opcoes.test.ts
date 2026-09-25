import { describe, it, expect } from 'vitest'
import { bonusVisivelPara, opcoesDaClassificacao } from '../classificacao-opcoes'

describe('bonusVisivelPara', () => {
  it('o SUPER_ADMIN sempre vê a bonificação', () => {
    expect(bonusVisivelPara('SUPER_ADMIN', { bonusVisivelParaAdmin: false })).toBe(true)
  })

  it('os demais papéis só depois de a Secretaria liberar o painel', () => {
    expect(bonusVisivelPara('ADMIN', { bonusVisivelParaAdmin: false })).toBe(false)
    expect(bonusVisivelPara('ADMIN', { bonusVisivelParaAdmin: true })).toBe(true)
  })
})

describe('opcoesDaClassificacao', () => {
  const categoriasConfig = [
    { nome: 'Música', vagasAmplaConcorrencia: 3, cotas: [], valorPorProjeto: 5000, valorTotalCategoria: 15000 },
  ]

  it('converte nota mínima e suplentes e repassa a configuração de categorias', () => {
    const opcoes = opcoesDaClassificacao(
      { notaMinima: '60.5' as never, vagasSuplentes: 4, categoriasConfig: categoriasConfig as never },
      true,
    )

    expect(opcoes).toEqual({ incluirBonus: true, notaMinima: 60.5, maxSuplentes: 4, categoriasConfig })
  })

  it('sem nota mínima nem categorias, devolve nulos', () => {
    const opcoes = opcoesDaClassificacao(
      { notaMinima: null, vagasSuplentes: null, categoriasConfig: null },
      false,
    )

    expect(opcoes).toEqual({ incluirBonus: false, notaMinima: null, maxSuplentes: null, categoriasConfig: null })
  })

  it('categoriasConfig que não é lista é ignorada', () => {
    const opcoes = opcoesDaClassificacao(
      { notaMinima: null, vagasSuplentes: null, categoriasConfig: { nome: 'x' } as never },
      false,
    )

    expect(opcoes.categoriasConfig).toBeNull()
  })
})
