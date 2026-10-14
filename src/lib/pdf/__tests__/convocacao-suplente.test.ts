import { describe, it, expect } from 'vitest'
import { gerarPdfConvocacaoSuplente, DADOS_CONVOCACAO_SUPLENTE } from '../convocacao-suplente'

describe('gerarPdfConvocacaoSuplente', () => {
  it('gera um buffer PDF válido contendo a estrutura esperada', async () => {
    const buffer = await gerarPdfConvocacaoSuplente()

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1000)
    // Assinatura do cabeçalho PDF
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF')
  })

  it('possui a categoria CULTURA POPULAR e as propostas 0091 e 0007 configuradas', () => {
    expect(DADOS_CONVOCACAO_SUPLENTE.categoria).toBe('CULTURA POPULAR')
    expect(DADOS_CONVOCACAO_SUPLENTE.titulo).toBe('Convocação de Suplente')

    const p0091 = DADOS_CONVOCACAO_SUPLENTE.suplentes.find((s) => s.numero === 'PNAB-2026-0091')
    expect(p0091).toBeDefined()
    expect(p0091?.cpfCnpj).toBe('**.025.456/0001-**')
    expect(p0091?.situacao).toBe('Desclassificado')
    expect(p0091?.classificado).toBe(false)
    expect(p0091?.motivo).toContain('Não apresentação da documentação exigida na habilitação.')

    const p0007 = DADOS_CONVOCACAO_SUPLENTE.suplentes.find((s) => s.numero === 'PNAB-2026-0007')
    expect(p0007).toBeDefined()
    expect(p0007?.nome).toBe('Paulo Ricardo da Silva Nascimento')
    expect(p0007?.cpfCnpj).toBe('***.924.185-**')
    expect(p0007?.situacao).toBe('Classificado')
    expect(p0007?.classificado).toBe(true)
  })
})
