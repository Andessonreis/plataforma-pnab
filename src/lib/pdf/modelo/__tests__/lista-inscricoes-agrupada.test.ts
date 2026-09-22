import { describe, it, expect } from 'vitest'
import { itemDeLista as item, listaInscricoesDeTeste } from '@/lib/pdf/__tests__/apoio-pdf'
import { agruparPorArea, montarListaInscricoes, AREA_SEM_CATEGORIA } from '../lista-inscricoes'

describe('agruparPorArea', () => {
  it('ordena as áreas pelo texto e agrupa quem não tem categoria à parte', () => {
    const grupos = agruparPorArea([
      item(1, { categoria: 'Teatro' }),
      item(2, { categoria: null }),
      item(3, { categoria: 'Música' }),
      item(4, { categoria: 'Teatro' }),
    ])

    expect(grupos.map((g) => [g.area, g.itens.map((i) => i.posicao)])).toEqual([
      ['Música', [3]],
      [AREA_SEM_CATEGORIA, [2]],
      ['Teatro', [1, 4]],
    ])
  })

  it('ordena por unidade de código: maiúscula vem antes de minúscula acentuada', () => {
    const areas = agruparPorArea([item(1, { categoria: 'música' }), item(2, { categoria: 'Teatro' })])
      .map((g) => g.area)

    expect(areas).toEqual(['Teatro', 'música'])
  })

  it('lista vazia não gera grupo', () => {
    expect(agruparPorArea([])).toEqual([])
  })
})

describe('montarListaInscricoes — agrupada por área', () => {
  const inscricoes = [
    item(1, { categoria: 'Teatro' }),
    item(2, { categoria: 'Música' }),
    item(3, { categoria: 'Teatro' }),
    item(4, { categoria: null }),
  ]
  const modelo = montarListaInscricoes(listaInscricoesDeTeste({ agruparPorCategoria: true, inscricoes }))

  it('gera uma seção por área, em ordem alfabética, com a contagem no título', () => {
    expect(modelo.agrupada).toBe(true)
    expect(modelo.secoes.map((s) => s.titulo)).toEqual([
      'Música (1)', `${AREA_SEM_CATEGORIA} (1)`, 'Teatro (2)',
    ])
  })

  it('renumera a partir de 1 dentro de cada área e oculta a coluna de categoria', () => {
    expect(modelo.colunas.map((c) => c.label)).not.toContain('Categoria')
    expect(modelo.secoes[2].linhas.map((linha) => linha[0])).toEqual(['1', '2'])
  })

  it('traz o quadro-resumo com o total de cada área', () => {
    expect(modelo.resumoPorArea).toEqual({
      titulo: 'Distribuição por área / categoria',
      areas: [
        { area: 'Música', total: 1 },
        { area: AREA_SEM_CATEGORIA, total: 1 },
        { area: 'Teatro', total: 2 },
      ],
    })
  })

  it('ficha e total falam em áreas e no total geral do edital', () => {
    expect(modelo.ficha[3]).toEqual({ label: 'Total na lista', value: '4 inscrição(ões) em 3 área(s)' })
    expect(modelo.textoTotal).toBe('Total geral do edital: 4 inscrição(ões)')
  })

  it('com uma área só não há o que comparar, então o resumo some', () => {
    const uma = montarListaInscricoes(listaInscricoesDeTeste({
      agruparPorCategoria: true,
      inscricoes: [item(1), item(2)],
    }))

    expect(uma.resumoPorArea).toBeNull()
    expect(uma.secoes).toHaveLength(1)
  })

  it('vence a restrição a uma área, mas a área continua na ficha e no protocolo', () => {
    const ambas = montarListaInscricoes(listaInscricoesDeTeste({ agruparPorCategoria: true, categoria: 'Música', inscricoes }))

    expect(ambas.agrupada).toBe(true)
    expect(ambas.secoes).toHaveLength(3)
    expect(ambas.ficha[1]).toEqual({ label: 'Área / categoria', value: 'Música' })
    expect(ambas.protocolo[3].valor).toBe('Música')
  })
})
