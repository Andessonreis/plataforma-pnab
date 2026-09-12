import { describe, it, expect } from 'vitest'
import { formatCampoValue } from '../projeto-completo'
import type { CampoFormulario } from '@/types/campo-formulario'

// Bug real: campo tabela/grupo_repetivel virava JSON.stringify() cru no PDF,
// e por ser texto longo estourava a altura fixa de addTwoColumnRow — o
// conteúdo seguinte era desenhado por cima antes do texto acabar de quebrar
// linha. Ver dossiê PNAB-2026-0147 (relatado 11/09/2026).

describe('formatCampoValue', () => {
  it('valor vazio/nulo vira travessão', () => {
    expect(formatCampoValue(null, undefined, 'x')).toBe('—')
    expect(formatCampoValue(undefined, undefined, 'x')).toBe('—')
    expect(formatCampoValue('', undefined, 'x')).toBe('—')
  })

  it('array de strings (multiselect) vira lista separada por ; — nunca JSON', () => {
    const result = formatCampoValue(['Mulheres', 'Negros e/ou negras'], undefined, 'publico_prioritario')
    expect(result).toBe('Mulheres; Negros e/ou negras')
    expect(result).not.toContain('[')
    expect(result).not.toContain('"')
  })

  it('array vazio vira travessão, não "[]"', () => {
    expect(formatCampoValue([], undefined, 'acessibilidade')).toBe('—')
  })

  it('array de objetos (grupo_repetivel) vira bloco legível usando os labels dos subcampos', () => {
    const campo: CampoFormulario = {
      nome: 'equipe',
      label: 'Equipe',
      tipo: 'grupo_repetivel',
      subcampos: [
        { nome: 'nome', label: 'Nome', tipo: 'texto' },
        { nome: 'funcao', label: 'Função', tipo: 'texto' },
      ],
    }
    const value = [
      { nome: 'Alex Rocha Santos', funcao: 'Artista visual' },
      { nome: 'Taíse Gama Bastos', funcao: 'Apoio' },
    ]
    const result = formatCampoValue(value, campo, 'equipe')

    expect(result).toContain('1. Nome: Alex Rocha Santos')
    expect(result).toContain('Função: Artista visual')
    expect(result).toContain('2. Nome: Taíse Gama Bastos')
    // nunca deve sobrar JSON bruto no texto renderizado
    expect(result).not.toMatch(/[{}[\]]/)
  })

  it('array de objetos (tabela) usa os labels de colunas, com moeda e data formatadas', () => {
    const campo: CampoFormulario = {
      nome: 'planilha_orcamentaria',
      label: 'Planilha orçamentária',
      tipo: 'tabela',
      colunas: [
        { nome: 'descricao_item', label: 'Item', tipo: 'texto' },
        { nome: 'valor_total', label: 'Valor total', tipo: 'moeda' },
      ],
    }
    const value = [{ descricao_item: 'Cachê do artista', valor_total: '1800.00' }]
    const result = formatCampoValue(value, campo, 'planilha_orcamentaria')

    expect(result).toBe('Item: Cachê do artista\nValor total: R$\xa01.800,00')
  })

  it('um item só não recebe numeração de lista', () => {
    const campo: CampoFormulario = {
      nome: 'equipe',
      label: 'Equipe',
      tipo: 'grupo_repetivel',
      subcampos: [{ nome: 'nome', label: 'Nome', tipo: 'texto' }],
    }
    const result = formatCampoValue([{ nome: 'Alex' }], campo, 'equipe')
    expect(result).toBe('Nome: Alex')
  })

  it('array de objetos sem colunas/subcampos definidos cai num fallback chave:valor legível (nunca JSON.stringify aninhado)', () => {
    const result = formatCampoValue([{ a: '1', b: '2' }], undefined, 'campo_sem_definicao')
    expect(result).toBe('a: 1\nb: 2')
  })

  it('moeda continua formatada normalmente pra campos simples', () => {
    expect(formatCampoValue('1234.5', { nome: 'x', label: 'X', tipo: 'moeda' }, 'x')).toContain('R$')
  })

  it('data pura (sem hora) não sofre deslocamento de fuso horário', () => {
    // Bug real: new Date('2026-11-08') vira meia-noite UTC; convertido pra
    // America/Sao_Paulo (UTC-3) voltava pro dia anterior — cronograma saía
    // com a data errada no PDF (28/09 virava 27/09).
    expect(formatCampoValue('2026-11-08', { nome: 'x', label: 'X', tipo: 'data' }, 'x')).toBe('08/11/2026')
    expect(formatCampoValue('2026-01-01', { nome: 'x', label: 'X', tipo: 'data' }, 'x')).toBe('01/01/2026')
  })
})
