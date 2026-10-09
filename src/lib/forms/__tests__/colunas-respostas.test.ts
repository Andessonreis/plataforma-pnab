import { describe, it, expect } from 'vitest'
import { colunasDosSnapshots, valorDaColuna } from '@/lib/forms'
import type { CampoFormulario } from '@/types/campo-formulario'

const v1: CampoFormulario[] = [
  { nome: 'aviso', label: 'Aviso', tipo: 'info', conteudo: 'x' },
  { nome: 'nome', label: 'Nome', tipo: 'texto' },
  { nome: 'publico', label: 'Público', tipo: 'multiselect', opcoes: ['A', 'B'] },
]
const v2: CampoFormulario[] = [
  { nome: 'nome', label: 'Nome completo', tipo: 'texto' },
  { nome: 'equipe', label: 'Equipe', tipo: 'tabela', colunas: [{ nome: 'n', label: 'Membro', tipo: 'texto' }, { nome: 'f', label: 'Função', tipo: 'texto' }] },
]

describe('colunasDosSnapshots', () => {
  it('ignora info, abre tabela em colunas e usa o rótulo do primeiro snapshot', () => {
    expect(colunasDosSnapshots([v2, v1])).toEqual([
      { chave: 'nome', rotulo: 'Nome completo' },
      { chave: 'equipe.n', rotulo: 'Equipe — Membro' },
      { chave: 'equipe.f', rotulo: 'Equipe — Função' },
      { chave: 'publico', rotulo: 'Público' },
    ])
  })
})

describe('valorDaColuna', () => {
  it('junta multiselect com ";" e linhas de tabela com "|"', () => {
    const dados = { publico: ['A', 'B'], equipe: [{ n: 'Rui', f: 'Guia' }, { n: 'Lia' }] }
    expect(valorDaColuna(dados, 'publico')).toBe('A; B')
    expect(valorDaColuna(dados, 'equipe.n')).toBe('Rui | Lia')
    expect(valorDaColuna(dados, 'equipe.f')).toBe('Guia | ')
  })

  it('devolve vazio para campo ausente ou tabela malformada', () => {
    expect(valorDaColuna({}, 'nome')).toBe('')
    expect(valorDaColuna({ equipe: 'x' }, 'equipe.n')).toBe('')
  })
})
