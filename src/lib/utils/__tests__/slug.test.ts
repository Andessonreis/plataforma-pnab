import { describe, it, expect } from 'vitest'
import { generateTipoSlug, generateEditalSlug, generateContentSlug, generateSimpleSlug } from '../slug'

describe('generateTipoSlug', () => {
  it('converte label simples para UPPER_SNAKE_CASE', () => {
    expect(generateTipoSlug('Certidão Negativa')).toBe('CERTIDAO_NEGATIVA')
  })

  it('remove acentos (NFD normalization)', () => {
    expect(generateTipoSlug('Certidão Negativa de Débitos')).toBe('CERTIDAO_NEGATIVA_DE_DEBITOS')
    expect(generateTipoSlug('Comprovação de Endereço')).toBe('COMPROVACAO_DE_ENDERECO')
  })

  it('converte hífens em underscores', () => {
    expect(generateTipoSlug('RG - Frente e Verso')).toBe('RG_FRENTE_E_VERSO')
  })

  it('remove caracteres especiais', () => {
    expect(generateTipoSlug('CPF/CNPJ (cópia)')).toBe('CPFCNPJ_COPIA')
  })

  it('colapsa espaços múltiplos', () => {
    expect(generateTipoSlug('Declaração   de   Residência')).toBe('DECLARACAO_DE_RESIDENCIA')
  })

  it('remove underscores nas bordas', () => {
    expect(generateTipoSlug(' Teste ')).toBe('TESTE')
    expect(generateTipoSlug('_teste_')).toBe('TESTE')
  })

  it('mantém números', () => {
    expect(generateTipoSlug('Formulário 2025')).toBe('FORMULARIO_2025')
  })

  it('string vazia retorna vazio', () => {
    expect(generateTipoSlug('')).toBe('')
  })

  it('string só com acentos/especiais', () => {
    expect(generateTipoSlug('ção')).toBe('CAO')
  })
})

describe('generateEditalSlug', () => {
  it('gera slug com título e ano', () => {
    expect(generateEditalSlug('Edital de Fomento', 2025)).toBe('edital-de-fomento-2025')
  })
})

describe('generateSimpleSlug', () => {
  it('gera slug simples sem timestamp', () => {
    expect(generateSimpleSlug('Página de Teste')).toBe('pagina-de-teste')
  })
})

describe('generateContentSlug', () => {
  it('gera slug com timestamp base36', () => {
    const slug = generateContentSlug('Notícia importante')
    expect(slug).toMatch(/^noticia-importante-[a-z0-9]+$/)
  })
})
