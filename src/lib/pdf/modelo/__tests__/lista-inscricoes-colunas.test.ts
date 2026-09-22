import { describe, it, expect } from 'vitest'
import { LARGURA_UTIL } from '@/lib/pdf/documento-oficial/tema'
import { itemDeLista } from '@/lib/pdf/__tests__/apoio-pdf'
import {
  buildRowValues, getColumns, STATUS_COM_MOTIVO, STATUS_COM_NOTA, STATUS_COM_TELEFONE,
} from '../lista-inscricoes-colunas'
import type { ListaInscricoesItem } from '../tipos'

function item(parcial: Partial<ListaInscricoesItem> = {}): ListaInscricoesItem {
  return itemDeLista(3, { motivoInabilitacao: 'Documentação incompleta', ...parcial })
}

const rotulos = (status: string, ocultarCategoria: boolean) =>
  getColumns(status, ocultarCategoria).map((coluna) => coluna.label)

describe('conjuntos de status', () => {
  it('nota e posição só aparecem nos status de resultado', () => {
    expect([...STATUS_COM_NOTA].sort()).toEqual(['CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'])
  })

  it('motivo só na lista de inabilitados e telefone só na de rascunhos', () => {
    expect([...STATUS_COM_MOTIVO]).toEqual(['INABILITADA'])
    expect([...STATUS_COM_TELEFONE]).toEqual(['RASCUNHO'])
  })
})

describe('getColumns', () => {
  it('lista contínua leva a categoria como coluna', () => {
    expect(rotulos('ENVIADA', false)).toEqual(['Nº', 'Protocolo', 'Nome', 'CPF/CNPJ', 'Categoria'])
  })

  it('com a categoria oculta, a coluna some', () => {
    expect(rotulos('ENVIADA', true)).toEqual(['Nº', 'Protocolo', 'Nome', 'CPF/CNPJ'])
  })

  it.each([
    ['CONTEMPLADA', ['Nota', 'Pos.']],
    ['SUPLENTE', ['Nota', 'Pos.']],
    ['NAO_CONTEMPLADA', ['Nota', 'Pos.']],
    ['INABILITADA', ['Motivo']],
    ['RASCUNHO', ['Telefone']],
    ['HABILITADA', []],
  ])('status %s acrescenta %j ao fim', (status, extras) => {
    expect(rotulos(status, false).slice(5)).toEqual(extras)
    expect(rotulos(status, true).slice(4)).toEqual(extras)
  })

  it.each(['ENVIADA', 'HABILITADA', 'CONTEMPLADA', 'INABILITADA', 'RASCUNHO'])(
    'status %s fecha exatamente na largura útil da página, com ou sem categoria',
    (status) => {
      for (const ocultar of [false, true]) {
        const soma = getColumns(status, ocultar).reduce((total, coluna) => total + coluna.width, 0)
        expect(soma).toBeCloseTo(LARGURA_UTIL, 6)
      }
    },
  )

  it('cada chamada devolve colunas novas, sem compartilhar estado', () => {
    const primeira = getColumns('ENVIADA')
    primeira[0].width = 999

    expect(getColumns('ENVIADA')[0].width).toBe(24)
  })
})

describe('buildRowValues', () => {
  it('mascara o CPF e o CNPJ deixando só os extremos', () => {
    expect(buildRowValues(item(), 'ENVIADA')[3]).toBe('123.***.***-01')
    expect(buildRowValues(item({ cpfCnpj: '12.345.678/0001-99' }), 'ENVIADA')[3]).toBe('123.***.***-99')
  })

  it('lista contínua inclui a categoria, e "—" quando não há', () => {
    expect(buildRowValues(item(), 'ENVIADA')).toEqual(
      ['3', 'PNAB-2026-0003', 'Maria da Silva', '123.***.***-01', 'Música'],
    )
    expect(buildRowValues(item({ categoria: null }), 'ENVIADA')[4]).toBe('—')
  })

  it('com a categoria oculta, a linha não a repete', () => {
    expect(buildRowValues(item(), 'ENVIADA', true)).toEqual(
      ['3', 'PNAB-2026-0003', 'Maria da Silva', '123.***.***-01'],
    )
  })

  it('status de resultado leva nota com duas casas e a posição', () => {
    expect(buildRowValues(item(), 'CONTEMPLADA', true).slice(4)).toEqual(['87.50', '3'])
    expect(buildRowValues(item({ notaFinal: null }), 'SUPLENTE', true).slice(4)).toEqual(['—', '3'])
  })

  it('inabilitada leva o motivo, e "—" quando não foi informado', () => {
    expect(buildRowValues(item(), 'INABILITADA', true)[4]).toBe('Documentação incompleta')
    expect(buildRowValues(item({ motivoInabilitacao: null }), 'INABILITADA', true)[4]).toBe('—')
  })

  it('rascunho leva o telefone formatado, e "—" quando falta', () => {
    expect(buildRowValues(item(), 'RASCUNHO', true)[4]).toBe('(74) 99999-8888')
    expect(buildRowValues(item({ telefone: null }), 'RASCUNHO', true)[4]).toBe('—')
  })

  it('telefone e motivo não vazam para listas publicáveis', () => {
    expect(buildRowValues(item(), 'HABILITADA', true)).toHaveLength(4)
    expect(buildRowValues(item(), 'ENVIADA', false)).toHaveLength(5)
  })

  it('a linha tem uma célula por coluna em todo status', () => {
    for (const status of ['ENVIADA', 'CONTEMPLADA', 'INABILITADA', 'RASCUNHO']) {
      for (const ocultar of [false, true]) {
        expect(buildRowValues(item(), status, ocultar)).toHaveLength(getColumns(status, ocultar).length)
      }
    }
  })
})
