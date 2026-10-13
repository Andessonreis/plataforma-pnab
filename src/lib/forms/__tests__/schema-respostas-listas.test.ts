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

describe('construirSchemaDeRespostas — tabela e grupo repetível', () => {
  const tabela: CampoFormulario = {
    nome: 'equipe', label: 'Equipe', tipo: 'tabela', linhaMin: 2, linhaMax: 3,
    colunas: [
      { nome: 'membro', label: 'Membro', tipo: 'texto', obrigatorio: true },
      { nome: 'idade', label: 'Idade', tipo: 'numero' },
    ],
  }
  const grupo: CampoFormulario = {
    nome: 'filhos', label: 'Filhos', tipo: 'grupo_repetivel', itemMax: 1, obrigatorio: true,
    subcampos: [{ nome: 'nome', label: 'Nome', tipo: 'texto', obrigatorio: true }],
  }

  it('valida mínimo e máximo de linhas', () => {
    const linha = { membro: 'Ana' }
    expect(mensagens([tabela], { equipe: [linha] }).equipe).toMatch(/ao menos 2 linhas/)
    expect(validar([tabela], { equipe: [linha, linha] }).success).toBe(true)
    expect(mensagens([tabela], { equipe: [linha, linha, linha, linha] }).equipe).toMatch(/no máximo 3 linhas/)
  })

  it('valida cada célula e aponta a linha com erro', () => {
    const r = mensagens([tabela], { equipe: [{ membro: 'Ana' }, { membro: '', idade: '-2' }] })
    expect(r.equipe).toBe('Membro é obrigatório. (2ª linha)')
  })

  it('remove colunas desconhecidas das linhas', () => {
    const r = validar([tabela], { equipe: [{ membro: 'A', x: 1 }, { membro: 'B' }] })
    expect(r.success && r.data.equipe).toEqual([{ membro: 'A' }, { membro: 'B' }])
  })

  it('grupo obrigatório exige 1 item mesmo sem itemMin', () => {
    expect(mensagens([grupo], {}).filhos).toBe('Filhos: adicione ao menos 1 item.')
    expect(validar([grupo], { filhos: [{ nome: 'Rui' }] }).success).toBe(true)
    expect(mensagens([grupo], { filhos: [{ nome: 'A' }, { nome: 'B' }] }).filhos).toBe('Filhos: no máximo 1 item.')
  })

  it('tabela opcional pode ficar vazia', () => {
    const opcional = { ...tabela, linhaMin: undefined }
    expect(validar([opcional], {}).success).toBe(true)
  })

  it('rejeita tabela que não é lista', () => {
    expect(validar([tabela], { equipe: 'x' }).success).toBe(false)
  })
})

describe('errosPorCampo', () => {
  it('mantém só a primeira mensagem de cada campo', () => {
    const campos = [texto({ obrigatorio: true }), { nome: 'b', label: 'B', tipo: 'texto' as const, obrigatorio: true }]
    expect(mensagens(campos, {})).toEqual({ nome: 'Nome é obrigatório.', b: 'B é obrigatório.' })
  })
})
