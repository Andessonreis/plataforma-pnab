import { describe, it, expect } from 'vitest'
import { categoriasDoDocumento, rotuloDaSituacao } from '../lista-classificacao'
import type { CategoriaClassificacao, LinhaClassificacao } from '../tipos'

function linha(numero: string, status: LinhaClassificacao['status']): LinhaClassificacao {
  return {
    posicao: 1, numero, proponente: 'PROPONENTE', notaBase: 80, notaBonus: 0, notaFinal: 80,
    cotista: false, status, semAvaliacao: false,
  }
}

function categoria(nome: string, linhas: LinhaClassificacao[]): CategoriaClassificacao {
  return { nome, vagasAmplaConcorrencia: 1, cotas: [], valorPorProjeto: null, linhas }
}

describe('rotuloDaSituacao', () => {
  it('o resultado final chama de "Contemplado" quem os outros estados chamam de "Classificado"', () => {
    expect(rotuloDaSituacao('CONTEMPLADA', 'FINAL')).toBe('Contemplado')
    expect(rotuloDaSituacao('CONTEMPLADA', 'CONSOLIDADA')).toBe('Classificado')
    expect(rotuloDaSituacao('CONTEMPLADA', 'PREVIA')).toBe('Classificado')
  })

  it('os demais rótulos não mudam com a situação', () => {
    expect(rotuloDaSituacao('SUPLENTE', 'FINAL')).toBe('Suplente')
    expect(rotuloDaSituacao('NAO_CONTEMPLADA', 'FINAL')).toBe('Desclassificado')
    expect(rotuloDaSituacao('NAO_SE_APLICA', 'FINAL')).toBe('Não se aplica')
  })
})

describe('categoriasDoDocumento', () => {
  const categorias = [
    categoria('Música', [linha('A', 'CONTEMPLADA'), linha('B', 'SUPLENTE'), linha('C', 'NAO_CONTEMPLADA')]),
    categoria('Dança', [linha('D', 'NAO_CONTEMPLADA')]),
    categoria('Outros', [linha('E', 'NAO_SE_APLICA')]),
  ]

  it('no resultado final tira os desclassificados e a categoria que ficar sem linha', () => {
    const final = categoriasDoDocumento(categorias, 'FINAL')

    expect(final.map((c) => [c.nome, c.linhas.map((l) => l.numero)])).toEqual([
      ['Música', ['A', 'B']],
      ['Outros', ['E']],
    ])
  })

  it('nas outras situações devolve a lista como veio', () => {
    expect(categoriasDoDocumento(categorias, 'CONSOLIDADA')).toBe(categorias)
    expect(categoriasDoDocumento(categorias, 'PREVIA')).toBe(categorias)
  })

  it('não altera a lista de entrada', () => {
    categoriasDoDocumento(categorias, 'FINAL')
    expect(categorias[0].linhas).toHaveLength(3)
  })
})
