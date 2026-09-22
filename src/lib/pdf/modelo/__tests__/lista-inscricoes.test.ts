import { describe, it, expect } from 'vitest'
import { itemDeLista as item, listaInscricoesDeTeste } from '@/lib/pdf/__tests__/apoio-pdf'
import { avisoLegal, montarListaInscricoes } from '../lista-inscricoes'
import type { ListaInscricoesData } from '../tipos'

/** Lista de habilitados, o caso mais comum; o registro de emissão não entra no modelo. */
function dados(parcial: Partial<ListaInscricoesData> = {}): ListaInscricoesData {
  return listaInscricoesDeTeste({ status: 'HABILITADA', statusLabel: 'Habilitada', ...parcial })
}

describe('montarListaInscricoes — identificação', () => {
  it('título, subtítulo e rótulo vêm do módulo de títulos', () => {
    const modelo = montarListaInscricoes(dados())

    expect(modelo.titulo).toBe('Relação Definitiva de Habilitados')
    expect(modelo.subtitulo).toBe('Edital de teste · 2026')
    expect(modelo.rotulo).toBe('Inscrições')
  })

  it('título fixado na geração tem precedência', () => {
    expect(montarListaInscricoes(dados({ tituloDocumento: 'Relação preliminar' })).titulo)
      .toBe('Relação preliminar')
  })

  it('a linha "Documento" do protocolo repete o título impresso', () => {
    const modelo = montarListaInscricoes(dados({ status: 'ENVIADA', statusLabel: 'Enviada' }))

    expect(modelo.protocolo[0]).toEqual({ rotulo: 'Documento', valor: modelo.titulo })
  })

  it('protocolo identifica edital, situação, categoria e total', () => {
    const modelo = montarListaInscricoes(dados({ total: 42 }))

    expect(modelo.protocolo).toEqual([
      { rotulo: 'Documento', valor: 'Relação Definitiva de Habilitados' },
      { rotulo: 'Edital', valor: 'Edital de teste (2026)' },
      { rotulo: 'Situação das inscrições', valor: 'Habilitada' },
      { rotulo: 'Categoria', valor: 'Todas' },
      { rotulo: 'Inscrições', valor: '42' },
    ])
  })

  it('protocolo cita a área quando a lista é restrita a uma', () => {
    const modelo = montarListaInscricoes(dados({ categoria: 'Música' }))

    expect(modelo.protocolo[3]).toEqual({ rotulo: 'Categoria', valor: 'Música' })
  })
})

describe('montarListaInscricoes — lista contínua', () => {
  const modelo = montarListaInscricoes(dados({
    inscricoes: [item(1, { categoria: 'Teatro' }), item(2, { categoria: 'Música' })],
  }))

  it('é uma seção só, com a categoria em coluna e a posição original', () => {
    expect(modelo.agrupada).toBe(false)
    expect(modelo.secoes).toHaveLength(1)
    expect(modelo.secoes[0].titulo).toBe('Inscrições')
    expect(modelo.colunas.map((c) => c.label)).toContain('Categoria')
    expect(modelo.secoes[0].linhas.map((linha) => [linha[0], linha[4]])).toEqual([['1', 'Teatro'], ['2', 'Música']])
  })

  it('não tem quadro-resumo por área', () => {
    expect(modelo.resumoPorArea).toBeNull()
  })

  it('ficha e total falam de inscrições, sem áreas', () => {
    expect(modelo.ficha).toEqual([
      { label: 'Edital', value: 'Edital de teste' },
      { label: 'Ano', value: '2026' },
      { label: 'Situação das inscrições', value: 'Habilitada' },
      { label: 'Total na lista', value: '2 inscrição(ões)' },
    ])
    expect(modelo.textoTotal).toBe('Total: 2 inscrição(ões)')
  })

  it('lista vazia mantém a seção, sem linhas', () => {
    const vazia = montarListaInscricoes(dados({ inscricoes: [], total: 0 }))

    expect(vazia.secoes).toEqual([{ titulo: 'Inscrições', linhas: [] }])
    expect(vazia.textoTotal).toBe('Total: 0 inscrição(ões)')
  })
})

describe('montarListaInscricoes — restrita a uma área', () => {
  const modelo = montarListaInscricoes(dados({
    categoria: 'Música',
    inscricoes: [item(5), item(9), item(12)],
  }))

  it('leva a área na ficha e no título da seção', () => {
    expect(modelo.ficha[1]).toEqual({ label: 'Área / categoria', value: 'Música' })
    expect(modelo.secoes[0].titulo).toBe('Inscrições — Música')
  })

  it('oculta a coluna de categoria e renumera a partir de 1', () => {
    expect(modelo.colunas.map((c) => c.label)).not.toContain('Categoria')
    expect(modelo.secoes[0].linhas.map((linha) => linha[0])).toEqual(['1', '2', '3'])
  })

  it('o total continua o da lista, não o do edital', () => {
    expect(modelo.textoTotal).toBe('Total: 3 inscrição(ões)')
    expect(modelo.resumoPorArea).toBeNull()
  })
})

describe('avisoLegal', () => {
  it('lista oficial remete aos prazos do edital', () => {
    expect(avisoLegal('HABILITADA')).toMatch(/^Este documento é uma lista oficial/)
    expect(avisoLegal('HABILITADA')).toMatch(/consulte os prazos estabelecidos no edital\.$/)
  })

  it('rascunho é documento interno e avisa que não se publica', () => {
    const aviso = avisoLegal('RASCUNHO')

    expect(aviso).toMatch(/^Documento interno de trabalho/)
    expect(aviso).toContain('Não constitui lista oficial')
    expect(aviso).toContain('LGPD')
  })

  it('o modelo aplica o aviso do status', () => {
    expect(montarListaInscricoes(dados({ status: 'RASCUNHO', statusLabel: 'Rascunho' })).avisoLegal)
      .toBe(avisoLegal('RASCUNHO'))
  })
})
