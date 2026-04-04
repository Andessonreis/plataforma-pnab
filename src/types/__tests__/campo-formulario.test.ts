import { describe, it, expect } from 'vitest'
import { filterCamposByTipo, type CampoFormulario } from '../campo-formulario'

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
