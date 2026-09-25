import { describe, it, expect } from 'vitest'
import { categoriaLongaDeTeste, linhaDeClassificacao, listaClassificacaoDeTeste } from '@/lib/pdf/__tests__/apoio-pdf'
import { AVISO_PREVIA } from '@/lib/pdf/modelo/lista-classificacao'
import type { ListaClassificacaoData } from '@/lib/pdf/modelo/tipos'
import { gerarListaClassificacaoV1 } from '../lista-classificacao'
import { lerPdf, semEspacos } from './primitivas.fixtures'

/**
 * Gera a classificação da versão 1 de verdade, sem mock, e confere no texto do
 * PDF o que o leitor precisa ver: colunas de bonificação, situação de quem está
 * fora da classificação e o carimbo de prévia.
 */

const AVISO = semEspacos(AVISO_PREVIA)

async function textoPorPagina(dados = listaClassificacaoDeTeste()): Promise<string[]> {
  return (await lerPdf(await gerarListaClassificacaoV1(dados))).paginas
}

describe('bonificação em colunas', () => {
  it('abre os itens do edital em B1, B2 e B3', async () => {
    const [primeira] = await textoPorPagina()
    const linhas = primeira.split('\n')

    expect(linhas).toEqual(expect.arrayContaining(['B1', 'B2', 'B3']))
    expect(primeira).toContain('B3: PcD (+5)')
  })

  it('sem bonificação visível, a tabela não traz média nem colunas B', async () => {
    const [primeira] = await textoPorPagina(listaClassificacaoDeTeste({ mostraBonus: false, bonus: null }))

    expect(primeira).not.toContain('B1')
    expect(primeira).not.toMatch(/MÉDIA/)
  })
})

describe('inscrição fora da classificação', () => {
  it('imprime "Não se aplica" e "—" no lugar da posição e das notas', async () => {
    const [primeira] = await textoPorPagina()

    expect(primeira).toContain('Não se aplica')
    expect(primeira).toContain('Classificado')
    expect(primeira).toContain('Suplente')
    expect(primeira).toContain('2º')
    expect(primeira).not.toContain('3º')
  })
})

describe('carimbo de prévia', () => {
  it('leva a marca d\'água em toda folha e o aviso na primeira', async () => {
    const paginas = await textoPorPagina(listaClassificacaoDeTeste({ situacao: 'PREVIA', categorias: categoriaLongaDeTeste() }))

    expect(paginas.length).toBeGreaterThan(1)
    paginas.forEach((pagina) => expect(pagina).toContain('PRÉVIA'))
    expect(semEspacos(paginas[0])).toContain(AVISO)
    paginas.slice(1).forEach((pagina) => expect(semEspacos(pagina)).not.toContain(AVISO))
  })

  it.each(['CONSOLIDADA', 'FINAL'] as const)('resultado %s sai sem marca d\'água nem aviso', async (situacao) => {
    const paginas = await textoPorPagina(listaClassificacaoDeTeste({ situacao, categorias: categoriaLongaDeTeste() }))

    paginas.forEach((pagina) => {
      expect(pagina).not.toContain('PRÉVIA')
      expect(semEspacos(pagina)).not.toContain(AVISO)
    })
  })

})

describe('relação de contemplados (resultado final)', () => {
  function categoriasComDesclassificado(): ListaClassificacaoData['categorias'] {
    const [musica] = listaClassificacaoDeTeste().categorias
    return [
      { ...musica, linhas: [...musica.linhas, linhaDeClassificacao(4, { status: 'NAO_CONTEMPLADA', notaFinal: 30, notaBonus: 0 })] },
      { ...musica, nome: 'Dança', linhas: [linhaDeClassificacao(1, { status: 'NAO_CONTEMPLADA', notaFinal: 20, notaBonus: 0 })] },
    ]
  }

  it('leva o título de relação de contemplados e o aviso de encerramento dos recursos', async () => {
    const [primeira] = await textoPorPagina(listaClassificacaoDeTeste({ situacao: 'FINAL' }))

    expect(primeira).toContain('Relação de Contemplados')
    expect(semEspacos(primeira)).toContain(semEspacos('Relação de contemplados e suplentes consolidada'))
  })

  it('chama de "Contemplado" quem as outras versões chamam de "Classificado"', async () => {
    const [final] = await textoPorPagina(listaClassificacaoDeTeste({ situacao: 'FINAL' }))
    const [consolidada] = await textoPorPagina(listaClassificacaoDeTeste({ situacao: 'CONSOLIDADA' }))

    expect(final).toContain('Contemplado')
    expect(final).not.toContain('Classificado')
    expect(consolidada).toContain('Classificado')
  })

  it('não lista desclassificados nem a categoria que ficou sem linha', async () => {
    const [final] = await textoPorPagina(listaClassificacaoDeTeste({ situacao: 'FINAL', categorias: categoriasComDesclassificado() }))
    const [consolidada] = await textoPorPagina(listaClassificacaoDeTeste({ situacao: 'CONSOLIDADA', categorias: categoriasComDesclassificado() }))

    expect(final).not.toContain('Desclassificado')
    expect(final).not.toContain('Dança')
    expect(consolidada).toContain('Desclassificado')
    expect(consolidada).toContain('Dança')
  })

  it('mantém a inscrição fora da classificação e conta contemplados e suplentes na abertura', async () => {
    const [final] = await textoPorPagina(listaClassificacaoDeTeste({ situacao: 'FINAL', categorias: categoriasComDesclassificado() }))

    expect(final).toContain('Não se aplica')
    expect(final).toMatch(/Contemplados\s+1\b/)
    expect(final).toMatch(/Suplentes\s+1\b/)
    expect(final).not.toContain('Total de Propostas')
  })
})
