import { describe, it, expect } from 'vitest'
import {
  NOME_DO_TIPO, ROTULO_DO_CROMO,
  identificacaoEdital, rotuloDoCromo, subtituloEdital, tituloDocumento, tituloRegistro,
  type EntradaTitulo,
} from '../titulos'

const EDITAL = { titulo: 'Festival de Arte e Cultura', ano: 2026 }

function lista(parcial: Partial<Extract<EntradaTitulo, { tipo: 'LISTA_INSCRICOES' }>> = {}): EntradaTitulo {
  return {
    tipo: 'LISTA_INSCRICOES',
    edital: EDITAL,
    status: 'INABILITADA',
    statusLabel: 'Inabilitada',
    ...parcial,
  }
}

describe('tituloDocumento — relação de inscrições', () => {
  it('habilitados saem como relação definitiva', () => {
    expect(tituloDocumento(lista({ status: 'HABILITADA', statusLabel: 'Habilitada' })))
      .toBe('Relação Definitiva de Habilitados')
  })

  it('enviadas saem como relação de inscritos', () => {
    expect(tituloDocumento(lista({ status: 'ENVIADA', statusLabel: 'Enviada' })))
      .toBe('Relação de Inscritos')
  })

  it('rascunhos têm título próprio', () => {
    expect(tituloDocumento(lista({ status: 'RASCUNHO', statusLabel: 'Rascunho' })))
      .toBe('Relação de Inscrições em Rascunho')
  })

  it('demais status levam o rótulo da situação', () => {
    expect(tituloDocumento(lista())).toBe('Relação de Inscrições — Inabilitada')
    expect(tituloDocumento(lista({ status: 'CONTEMPLADA', statusLabel: 'Contemplada' })))
      .toBe('Relação de Inscrições — Contemplada')
  })

  it('título fixado na geração tem precedência sobre o padrão do status', () => {
    expect(tituloDocumento(lista({
      status: 'HABILITADA', statusLabel: 'Habilitada', tituloDocumento: 'Relação preliminar',
    }))).toBe('Relação preliminar')
  })

  it('título fixado vazio ou nulo cai no padrão do status', () => {
    expect(tituloDocumento(lista({ status: 'ENVIADA', statusLabel: 'Enviada', tituloDocumento: null })))
      .toBe('Relação de Inscritos')
  })
})

describe('tituloDocumento — demais tipos', () => {
  it('agentes culturais', () => {
    expect(tituloDocumento({ tipo: 'LISTA_AGENTES' })).toBe('Agentes Culturais Cadastrados')
    expect(tituloDocumento({ tipo: 'LISTA_AGENTES', titulo: 'Agentes do edital' }))
      .toBe('Agentes do edital')
  })

  it('classificação distingue consolidado de prévia', () => {
    expect(tituloDocumento({ tipo: 'CLASSIFICACAO', edital: EDITAL, situacao: 'CONSOLIDADA' }))
      .toBe('Classificação por Categoria')
    expect(tituloDocumento({ tipo: 'CLASSIFICACAO', edital: EDITAL, situacao: 'PREVIA' }))
      .toBe('Classificação — Prévia de Trabalho')
  })

  it('classificação do resultado final leva "Resultado Final" no título', () => {
    expect(tituloDocumento({ tipo: 'CLASSIFICACAO', edital: EDITAL, situacao: 'FINAL' }))
      .toBe('Resultado Final da Classificação')
  })

  it('relatório final', () => {
    expect(tituloDocumento({ tipo: 'RELATORIO_FINAL', edital: EDITAL }))
      .toBe('Relatório Final de Resultado')
  })

  it('relatório de recursos leva a etapa', () => {
    expect(tituloDocumento({ tipo: 'RELATORIO_RECURSOS', edital: EDITAL, etapa: 'Habilitação' }))
      .toBe('Relatório de Recursos Interpostos - Habilitação')
  })

})

describe('linha do edital', () => {
  it('subtítulo da abertura', () => {
    expect(subtituloEdital(EDITAL)).toBe('Festival de Arte e Cultura · 2026')
  })

  it('identificação no protocolo', () => {
    expect(identificacaoEdital(EDITAL)).toBe('Festival de Arte e Cultura (2026)')
  })
})

describe('tituloRegistro', () => {
  it('leva a identificação do edital — a verificação mostra o documento sozinho', () => {
    expect(tituloRegistro(lista({ status: 'HABILITADA', statusLabel: 'Habilitada' })))
      .toBe('Relação Definitiva de Habilitados — Festival de Arte e Cultura (2026)')
  })

  it('classificação e relatório final usam o mesmo nome do papel', () => {
    expect(tituloRegistro({ tipo: 'CLASSIFICACAO', edital: EDITAL, situacao: 'CONSOLIDADA' }))
      .toBe('Classificação por Categoria — Festival de Arte e Cultura (2026)')
    expect(tituloRegistro({ tipo: 'RELATORIO_FINAL', edital: EDITAL }))
      .toBe('Relatório Final de Resultado — Festival de Arte e Cultura (2026)')
  })

  it('agentes culturais não têm edital', () => {
    expect(tituloRegistro({ tipo: 'LISTA_AGENTES' })).toBe('Agentes Culturais Cadastrados')
  })
})

describe('rótulos e nomes de tipo', () => {
  it('todo tipo titulável tem rótulo de cromo', () => {
    expect(rotuloDoCromo('LISTA_INSCRICOES')).toBe('Inscrições')
    expect(Object.values(ROTULO_DO_CROMO).every((r) => r.length > 0)).toBe(true)
  })

  it('nomeia também os tipos que não se titulam aqui, para o registro legado', () => {
    expect(NOME_DO_TIPO.LISTA_INSCRICOES).toBe('Lista de inscrições')
    expect(NOME_DO_TIPO.LISTA_RESULTADO).toBe('Resultado do edital')
    expect(NOME_DO_TIPO.COMPROVANTE_INSCRICAO).toBe('Comprovante de inscrição')
  })

  it('todo tipo titulável existe entre os tipos de documento', () => {
    for (const tipo of Object.keys(ROTULO_DO_CROMO)) {
      expect(NOME_DO_TIPO).toHaveProperty(tipo)
    }
  })
})
