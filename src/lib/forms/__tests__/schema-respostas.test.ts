import { describe, it, expect } from 'vitest'
import { construirSchemaDeRespostas, errosPorCampo } from '@/lib/forms'
import type { CampoFormulario } from '@/types/campo-formulario'

function validar(campos: CampoFormulario[], dados: Record<string, unknown>) {
  return construirSchemaDeRespostas(campos).safeParse(dados)
}

function mensagens(campos: CampoFormulario[], dados: Record<string, unknown>) {
  const r = validar(campos, dados)
  return r.success ? {} : errosPorCampo(r.error)
}

const texto = (extra: Partial<CampoFormulario> = {}): CampoFormulario => ({
  nome: 'nome', label: 'Nome', tipo: 'texto', ...extra,
})

describe('construirSchemaDeRespostas — obrigatoriedade', () => {
  it('rejeita obrigatório ausente, nulo ou em branco', () => {
    const campos = [texto({ obrigatorio: true })]
    for (const valor of [undefined, null, '', '   ']) {
      expect(mensagens(campos, { nome: valor }).nome).toBe('Nome é obrigatório.')
    }
  })

  it('aceita opcional vazio e remove a chave', () => {
    const r = validar([texto()], { nome: '' })
    expect(r.success).toBe(true)
    expect(r.success && 'nome' in r.data && r.data.nome !== undefined).toBe(false)
  })

  it('descarta chaves que não são campos', () => {
    const r = validar([texto()], { nome: 'Ana', intruso: 'x' })
    expect(r.success && r.data).toEqual({ nome: 'Ana' })
  })

  it('ignora info e arquivo, mesmo obrigatórios', () => {
    const campos: CampoFormulario[] = [
      { nome: 'aviso', label: 'Aviso', tipo: 'info', conteudo: 'x' },
      { nome: 'doc', label: 'Doc', tipo: 'arquivo', obrigatorio: true },
    ]
    expect(validar(campos, {}).success).toBe(true)
  })

  it('usa o nome técnico quando o rótulo está vazio', () => {
    expect(mensagens([texto({ label: '', obrigatorio: true })], {}).nome).toBe('nome é obrigatório.')
  })
})

describe('construirSchemaDeRespostas — texto e textarea', () => {
  it('aplica o limite padrão de 200 caracteres do texto curto', () => {
    expect(validar([texto()], { nome: 'a'.repeat(200) }).success).toBe(true)
    expect(mensagens([texto()], { nome: 'a'.repeat(201) }).nome).toMatch(/no máximo 200/)
  })

  it('aplica o limite padrão de 2000 do textarea', () => {
    const campo: CampoFormulario = { nome: 'obs', label: 'Obs', tipo: 'textarea' }
    expect(validar([campo], { obs: 'a'.repeat(2000) }).success).toBe(true)
    expect(validar([campo], { obs: 'a'.repeat(2001) }).success).toBe(false)
  })

  it('respeita minLength e maxLength explícitos', () => {
    const campos = [texto({ minLength: 5, maxLength: 8 })]
    expect(mensagens(campos, { nome: 'abc' }).nome).toMatch(/no mínimo 5/)
    expect(mensagens(campos, { nome: 'abcdefghi' }).nome).toMatch(/no máximo 8/)
    expect(validar(campos, { nome: 'abcdef' }).success).toBe(true)
  })

  it('não cobra mínimo de opcional vazio', () => {
    expect(validar([texto({ minLength: 5 })], { nome: '' }).success).toBe(true)
  })

  it('rejeita tipo errado', () => {
    expect(validar([texto()], { nome: 42 }).success).toBe(false)
    expect(validar([texto()], { nome: ['a'] }).success).toBe(false)
  })
})

describe('construirSchemaDeRespostas — número, moeda e data', () => {
  const numero: CampoFormulario = { nome: 'qtd', label: 'Quantidade', tipo: 'numero', obrigatorio: true }
  const moeda: CampoFormulario = { nome: 'valor', label: 'Valor', tipo: 'moeda' }
  const data: CampoFormulario = { nome: 'dia', label: 'Dia', tipo: 'data' }

  it('aceita número como string ou number e normaliza para string', () => {
    const r1 = validar([numero], { qtd: '12' })
    const r2 = validar([numero], { qtd: 12 })
    expect(r1.success && r1.data.qtd).toBe('12')
    expect(r2.success && r2.data.qtd).toBe('12')
  })

  it('rejeita negativo, texto e decimal malformado', () => {
    for (const qtd of ['-1', 'abc', '1.', '1,5']) {
      expect(validar([numero], { qtd }).success).toBe(false)
    }
  })

  it('aplica limite de 20 caracteres ao número', () => {
    expect(validar([numero], { qtd: '1'.repeat(21) }).success).toBe(false)
  })

  it('aceita moeda decimal e rejeita moeda negativa', () => {
    expect(validar([moeda], { valor: '1500.50' }).success).toBe(true)
    expect(validar([moeda], { valor: '-3' }).success).toBe(false)
  })

  it('aceita aliases em inglês dos tipos', () => {
    const campos: CampoFormulario[] = [
      { nome: 'a', label: 'A', tipo: 'number', obrigatorio: true },
      { nome: 'b', label: 'B', tipo: 'currency', obrigatorio: true },
      { nome: 'c', label: 'C', tipo: 'date', obrigatorio: true },
      { nome: 'd', label: 'D', tipo: 'text', obrigatorio: true },
    ]
    expect(validar(campos, { a: '1', b: '2.00', c: '2026-01-31', d: 'x' }).success).toBe(true)
  })

  it('valida data ISO existente no calendário', () => {
    expect(validar([data], { dia: '2026-02-28' }).success).toBe(true)
    expect(validar([data], { dia: '2028-02-29' }).success).toBe(true)
    for (const dia of ['2026-02-30', '2026-13-01', '31/12/2026', '2026-1-1']) {
      expect(mensagens([data], { dia }).dia).toBe('Dia: data inválida.')
    }
  })
})

describe('construirSchemaDeRespostas — select e multiselect', () => {
  const select: CampoFormulario = { nome: 'turno', label: 'Turno', tipo: 'select', opcoes: ['Manhã', 'Tarde'], obrigatorio: true }
  const multi: CampoFormulario = { nome: 'pub', label: 'Público', tipo: 'multiselect', opcoes: ['A', 'B', 'C'] }

  it('aceita só opção da lista no select', () => {
    expect(validar([select], { turno: 'Tarde' }).success).toBe(true)
    expect(mensagens([select], { turno: 'Noite' }).turno).toMatch(/escolha uma das opções/)
  })

  it('multiselect opcional vazio vira lista vazia', () => {
    const r = validar([multi], {})
    expect(r.success && r.data.pub).toEqual([])
  })

  it('multiselect obrigatório exige ao menos uma', () => {
    const campos = [{ ...multi, obrigatorio: true }]
    expect(mensagens(campos, { pub: [] }).pub).toMatch(/ao menos uma/)
    expect(validar(campos, { pub: ['A', 'C'] }).success).toBe(true)
  })

  it('multiselect rejeita opção desconhecida, repetida e não-lista', () => {
    expect(validar([multi], { pub: ['Z'] }).success).toBe(false)
    expect(validar([multi], { pub: ['A', 'A'] }).success).toBe(false)
    expect(validar([multi], { pub: 'A' }).success).toBe(false)
  })
})
