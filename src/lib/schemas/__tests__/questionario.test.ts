import { describe, it, expect } from 'vitest'
import { questionarioSchema, envioRespostaSchema } from '../questionario'

const base = {
  slug: 'pesquisa-de-visita',
  titulo: 'Pesquisa de visita',
  finalidade: 'memorial-pesquisa-visitante',
  campos: [{ nome: 'nome', label: 'Nome', tipo: 'texto' }],
}

function erros(campos: unknown[]) {
  const r = questionarioSchema.safeParse({ ...base, campos })
  return r.success ? [] : r.error.issues.map((i) => i.message)
}

describe('questionarioSchema', () => {
  it('aceita o mínimo e aplica defaults', () => {
    const r = questionarioSchema.parse(base)
    expect(r.status).toBeUndefined()
    expect(r.exigeLogin).toBe(false)
  })

  it('rejeita slug e finalidade fora do padrão kebab', () => {
    for (const slug of ['Pesquisa', 'com espaco', 'fim-', '-ini', 'a', 'dois--hifens']) {
      expect(questionarioSchema.safeParse({ ...base, slug }).success).toBe(false)
    }
    expect(questionarioSchema.safeParse({ ...base, finalidade: 'Memorial Agendamento' }).success).toBe(false)
  })

  it('rejeita status desconhecido', () => {
    expect(questionarioSchema.safeParse({ ...base, status: 'ATIVO' }).success).toBe(false)
  })

  it('rejeita tipo inválido e o tipo arquivo', () => {
    expect(erros([{ nome: 'x', label: 'X', tipo: 'checkbox' }])).toContain('Tipo de campo inválido.')
    expect(erros([{ nome: 'x', label: 'X', tipo: 'arquivo' }])).toContain('Tipo de campo inválido.')
  })

  it('rejeita nomes técnicos repetidos e fora do padrão', () => {
    expect(erros([base.campos[0], base.campos[0]])).toContain('Nome técnico "nome" repetido.')
    expect(erros([{ nome: 'Nome Completo', label: 'Nome', tipo: 'texto' }])[0]).toMatch(/nome técnico/)
  })

  it('exige rótulo nos campos preenchíveis', () => {
    expect(erros([{ nome: 'x', label: ' ', tipo: 'texto' }])[0]).toMatch(/sem rótulo/)
  })

  it('exige opções sem repetição em select e multiselect', () => {
    expect(erros([{ nome: 's', label: 'S', tipo: 'select', opcoes: [] }])[0]).toMatch(/ao menos uma opção/)
    expect(erros([{ nome: 's', label: 'S', tipo: 'multiselect' }])[0]).toMatch(/ao menos uma opção/)
    expect(erros([{ nome: 's', label: 'S', tipo: 'select', opcoes: ['A', 'A'] }])[0]).toMatch(/repetidas/)
  })

  it('exige conteúdo no bloco informativo e dispensa nome', () => {
    expect(erros([{ nome: '', label: '', tipo: 'info' }])[0]).toMatch(/sem conteúdo/)
    expect(erros([{ nome: '', label: '', tipo: 'info', conteudo: 'Leia antes.' }])).toEqual([])
  })

  it('exige colunas na tabela e subcampos no grupo, só de tipos simples', () => {
    expect(erros([{ nome: 't', label: 'T', tipo: 'tabela' }])[0]).toMatch(/ao menos uma coluna/)
    expect(erros([{ nome: 'g', label: 'G', tipo: 'grupo_repetivel', subcampos: [] }])[0]).toMatch(/ao menos uma coluna/)
    expect(erros([{ nome: 't', label: 'T', tipo: 'tabela', colunas: [{ nome: 'x', label: 'X', tipo: 'tabela' }] }]))
      .toContain('Coluna ou subcampo aceita só tipos simples.')
  })

  it('valida colunas repetidas e limites invertidos', () => {
    const col = { nome: 'c', label: 'C', tipo: 'texto' }
    expect(erros([{ nome: 't', label: 'T', tipo: 'tabela', colunas: [col, col] }])).toContain('Nome técnico "c" repetido.')
    expect(erros([{ nome: 't', label: 'T', tipo: 'tabela', colunas: [col], linhaMin: 3, linhaMax: 1 }])[0]).toMatch(/mínimo maior/)
    expect(erros([{ nome: 'x', label: 'X', tipo: 'texto', minLength: 10, maxLength: 5 }])[0]).toMatch(/mínimo de caracteres/)
  })

  it('aceita a mesma coluna em tabelas diferentes', () => {
    const col = { nome: 'nome', label: 'Nome', tipo: 'texto' }
    expect(erros([
      { nome: 't1', label: 'T1', tipo: 'tabela', colunas: [col] },
      { nome: 't2', label: 'T2', tipo: 'grupo_repetivel', subcampos: [col] },
    ])).toEqual([])
  })

  it('descarta propriedades estranhas do campo', () => {
    const r = questionarioSchema.parse({ ...base, campos: [{ ...base.campos[0], tiposProponente: ['PF'], x: 1 }] })
    expect(r.campos[0]).toEqual(base.campos[0])
  })
})

describe('envioRespostaSchema', () => {
  it('exige dados como objeto e valida e-mail opcional', () => {
    expect(envioRespostaSchema.safeParse({ dados: [] }).success).toBe(false)
    expect(envioRespostaSchema.safeParse({ dados: {}, email: 'x' }).success).toBe(false)
    expect(envioRespostaSchema.safeParse({ dados: {}, email: '' }).success).toBe(true)
  })
})
