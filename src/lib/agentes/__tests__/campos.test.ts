import { describe, it, expect } from 'vitest'
import { CAMPOS_AGENTE, labelDoCampo, valorDoCampo, type AgenteRow } from '../campos'

const AGENTE: AgenteRow = {
  nome: '  Maria das Graças Souza  ',
  email: 'maria@exemplo.com',
  telefone: '74999887766',
  cpfCnpj: '12345678901',
  tipoProponente: 'PF',
  role: 'PROPONENTE',
  cidade: 'Irecê',
  uf: 'BA',
  ativo: true,
  totalInscricoes: 2,
  createdAt: new Date('2026-08-11T20:12:44.128Z'),
}

const COMPLETO = { mascararDocumento: false }
const MASCARADO = { mascararDocumento: true }

describe('valorDoCampo', () => {
  it('nome sai sem espaço sobrando do cadastro', () => {
    expect(valorDoCampo(AGENTE, 'nome', COMPLETO)).toBe('Maria das Graças Souza')
  })

  it('telefone sai formatado', () => {
    expect(valorDoCampo(AGENTE, 'telefone', COMPLETO)).toBe('(74) 99988-7766')
  })

  it('documento completo no CSV, parcial no PDF', () => {
    expect(valorDoCampo(AGENTE, 'cpfCnpj', COMPLETO)).toBe('12345678901')
    expect(valorDoCampo(AGENTE, 'cpfCnpj', MASCARADO)).toBe('123.***.***-01')
  })

  it('tipo e perfil saem com rótulo legível', () => {
    expect(valorDoCampo(AGENTE, 'tipo', COMPLETO)).toBe('Pessoa física')
    expect(valorDoCampo(AGENTE, 'perfil', COMPLETO)).toBe('Proponente')
  })

  it('cidade junta com a UF', () => {
    expect(valorDoCampo(AGENTE, 'cidade', COMPLETO)).toBe('Irecê/BA')
  })

  it('cadastro sai na data de Brasília', () => {
    expect(valorDoCampo(AGENTE, 'cadastradoEm', COMPLETO)).toBe('11/08/2026')
  })

  it('campo vazio vira travessão, nunca string vazia', () => {
    const semDados: AgenteRow = {
      ...AGENTE,
      telefone: null,
      cpfCnpj: null,
      tipoProponente: null,
      cidade: null,
      uf: null,
    }

    expect(valorDoCampo(semDados, 'telefone', COMPLETO)).toBe('—')
    expect(valorDoCampo(semDados, 'cpfCnpj', COMPLETO)).toBe('—')
    expect(valorDoCampo(semDados, 'tipo', COMPLETO)).toBe('—')
    expect(valorDoCampo(semDados, 'cidade', COMPLETO)).toBe('—')
  })

  it('todo campo do catálogo tem rótulo e valor', () => {
    for (const campo of CAMPOS_AGENTE) {
      expect(labelDoCampo(campo).length).toBeGreaterThan(0)
      expect(valorDoCampo(AGENTE, campo, COMPLETO).length).toBeGreaterThan(0)
    }
  })
})
