import { describe, it, expect } from 'vitest'
import {
  filterCamposByTipo,
  isCampoEstrutura,
  flattenCamposPreenchiveis,
  type CampoFormulario,
} from '../campo-formulario'

const campoGeral: CampoFormulario = {
  nome: 'nome_projeto',
  label: 'Nome do Projeto',
  tipo: 'texto',
  obrigatorio: true,
}

const campoSemRestricao: CampoFormulario = {
  nome: 'descricao',
  label: 'Descrição',
  tipo: 'textarea',
  tiposProponente: [],
}

const campoPJ: CampoFormulario = {
  nome: 'razao_social',
  label: 'Razão Social',
  tipo: 'texto',
  obrigatorio: true,
  tiposProponente: ['PJ', 'MEI'],
}

const campoPF: CampoFormulario = {
  nome: 'rg',
  label: 'RG',
  tipo: 'texto',
  obrigatorio: true,
  tiposProponente: ['PF'],
}

const campoColetivo: CampoFormulario = {
  nome: 'membros',
  label: 'Membros do Coletivo',
  tipo: 'textarea',
  tiposProponente: ['COLETIVO'],
}

const todos = [campoGeral, campoSemRestricao, campoPJ, campoPF, campoColetivo]

describe('filterCamposByTipo', () => {
  it('PF vê campos gerais + campos PF, não vê PJ/COLETIVO', () => {
    const result = filterCamposByTipo(todos, 'PF')
    expect(result).toContain(campoGeral)
    expect(result).toContain(campoSemRestricao)
    expect(result).toContain(campoPF)
    expect(result).not.toContain(campoPJ)
    expect(result).not.toContain(campoColetivo)
  })

  it('PJ vê campos gerais + campos PJ/MEI', () => {
    const result = filterCamposByTipo(todos, 'PJ')
    expect(result).toContain(campoGeral)
    expect(result).toContain(campoSemRestricao)
    expect(result).toContain(campoPJ)
    expect(result).not.toContain(campoPF)
    expect(result).not.toContain(campoColetivo)
  })

  it('MEI vê campos gerais + campos PJ/MEI', () => {
    const result = filterCamposByTipo(todos, 'MEI')
    expect(result).toContain(campoGeral)
    expect(result).toContain(campoPJ)
    expect(result).not.toContain(campoPF)
  })

  it('COLETIVO vê campos gerais + campos COLETIVO', () => {
    const result = filterCamposByTipo(todos, 'COLETIVO')
    expect(result).toContain(campoGeral)
    expect(result).toContain(campoColetivo)
    expect(result).not.toContain(campoPJ)
    expect(result).not.toContain(campoPF)
  })

  it('tipoProponente null mostra todos os campos', () => {
    const result = filterCamposByTipo(todos, null)
    expect(result).toHaveLength(todos.length)
  })

  it('tipoProponente undefined mostra todos os campos', () => {
    const result = filterCamposByTipo(todos, undefined)
    expect(result).toHaveLength(todos.length)
  })

  it('campo sem tiposProponente (undefined) é visível para todos', () => {
    const result = filterCamposByTipo([campoGeral], 'PJ')
    expect(result).toContain(campoGeral)
  })

  it('campo com tiposProponente vazio é visível para todos', () => {
    const result = filterCamposByTipo([campoSemRestricao], 'PJ')
    expect(result).toContain(campoSemRestricao)
  })

  it('lista vazia retorna lista vazia', () => {
    expect(filterCamposByTipo([], 'PF')).toEqual([])
  })
})

describe('isCampoEstrutura', () => {
  it('retorna true para info, tabela e grupo_repetivel', () => {
    expect(isCampoEstrutura('info')).toBe(true)
    expect(isCampoEstrutura('tabela')).toBe(true)
    expect(isCampoEstrutura('grupo_repetivel')).toBe(true)
  })

  it('retorna false para tipos simples', () => {
    expect(isCampoEstrutura('texto')).toBe(false)
    expect(isCampoEstrutura('textarea')).toBe(false)
    expect(isCampoEstrutura('select')).toBe(false)
    expect(isCampoEstrutura('moeda')).toBe(false)
    expect(isCampoEstrutura('data')).toBe(false)
    expect(isCampoEstrutura('arquivo')).toBe(false)
  })
})

describe('flattenCamposPreenchiveis', () => {
  it('ignora blocos info', () => {
    const campos: CampoFormulario[] = [
      { nome: 'info1', label: 'Aviso', tipo: 'info', conteudo: 'texto' },
      { nome: 'nome', label: 'Nome', tipo: 'texto' },
    ]
    const result = flattenCamposPreenchiveis(campos)
    expect(result).toHaveLength(1)
    expect(result[0].nome).toBe('nome')
  })

  it('expande colunas de tabela', () => {
    const campos: CampoFormulario[] = [
      {
        nome: 'equipe',
        label: 'Equipe',
        tipo: 'tabela',
        colunas: [
          { nome: 'nome', label: 'Nome', tipo: 'texto', obrigatorio: true },
          { nome: 'funcao', label: 'Função', tipo: 'texto', obrigatorio: true },
        ],
      },
    ]
    const result = flattenCamposPreenchiveis(campos)
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.nome)).toEqual(['nome', 'funcao'])
  })

  it('expande subcampos de grupo_repetivel', () => {
    const campos: CampoFormulario[] = [
      {
        nome: 'planos',
        label: 'Planos',
        tipo: 'grupo_repetivel',
        subcampos: [
          { nome: 'tema', label: 'Tema', tipo: 'texto' },
          { nome: 'ementa', label: 'Ementa', tipo: 'textarea' },
        ],
      },
    ]
    const result = flattenCamposPreenchiveis(campos)
    expect(result.map((c) => c.nome)).toEqual(['tema', 'ementa'])
  })

  it('preserva campos simples no topo', () => {
    const campos: CampoFormulario[] = [
      { nome: 'titulo', label: 'Título', tipo: 'texto' },
      { nome: 'info1', label: 'Info', tipo: 'info', conteudo: 'x' },
      { nome: 'equipe', label: 'Equipe', tipo: 'tabela', colunas: [{ nome: 'n', label: 'N', tipo: 'texto' }] },
      { nome: 'valor', label: 'Valor', tipo: 'moeda' },
    ]
    const result = flattenCamposPreenchiveis(campos)
    expect(result.map((c) => c.nome)).toEqual(['titulo', 'n', 'valor'])
  })

  it('retorna lista vazia para entrada vazia', () => {
    expect(flattenCamposPreenchiveis([])).toEqual([])
  })

  it('tabela sem colunas retorna vazio para aquela tabela', () => {
    const campos: CampoFormulario[] = [
      { nome: 't', label: 'T', tipo: 'tabela' },
    ]
    expect(flattenCamposPreenchiveis(campos)).toEqual([])
  })
})
