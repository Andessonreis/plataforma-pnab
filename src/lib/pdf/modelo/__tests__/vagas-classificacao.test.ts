import { describe, expect, it } from 'vitest'
import { alocarVagasCategoria } from '@/lib/results/alocar-cotas'
import { modalidadesDaLinha, separarPorVaga } from '../vagas-classificacao'
import type { CategoriaClassificacao, LinhaClassificacao } from '../tipos'

// Caso dos Mestres (28/09/2026): 3 ampla, 1 cota negras, 1 cota indígenas/PcD sem optante, remanejada às outras cotas.
const CANDIDATOS: [string, number, string[]][] = [
  ['A', 29, ['negros']], ['B', 28, ['negros']], ['C', 27, []], ['D', 25, []],
  ['E', 24, ['negros']], ['F', 19, ['negros']], ['G', 18, []],
]
const COTAS = [
  { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 },
  { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 1 },
]

function categoria(destino?: 'OUTRAS_COTAS'): CategoriaClassificacao {
  const aloc = alocarVagasCategoria(
    CANDIDATOS.map(([id, nota, cotas]) => ({ inscricaoId: id, notaFinal: nota, totalAvaliacoes: 3, cotasOptIn: cotas })),
    { nome: 'X', vagasAmplaConcorrencia: 3, cotas: COTAS, valorPorProjeto: 1, valorTotalCategoria: 5, destinoVagaDeCotaVazia: destino },
    10, null,
  )
  const linhas: LinhaClassificacao[] = CANDIDATOS.map(([id, nota, cotas], i) => ({
    posicao: i + 1, numero: id, proponente: id, notaBase: nota, notaBonus: 0, notaFinal: nota,
    cotista: cotas.length > 0, cotasOptIn: cotas, vaga: aloc[i].vaga, status: aloc[i].status, semAvaliacao: false,
  }))
  return { nome: 'X', vagasAmplaConcorrencia: 3, cotas: COTAS, valorPorProjeto: 1, linhas }
}

describe('separarPorVaga', () => {
  it('optante com nota de ampla entra pela ampla e a cota fica para o próximo optante', () => {
    const [ampla, negras, indigenas] = separarPorVaga(categoria('OUTRAS_COTAS'))!.contempladas
    expect(ampla.linhas.map((l) => l.numero)).toEqual(['A', 'B', 'C'])
    expect(negras.linhas.map((l) => l.numero)).toEqual(['E', 'F'])
    expect(negras.recebidas).toBe(1)
    expect(negras.observacao).toBeNull()
    expect(indigenas.linhas).toEqual([])
    expect(indigenas.observacao).toContain('à cota Pessoas Negras')
  })

  it('sem destino para outras cotas, a vaga vazia vai à ampla e a observação diz isso', () => {
    const [ampla, , indigenas] = separarPorVaga(categoria())!.contempladas
    expect(ampla.linhas.map((l) => l.numero)).toEqual(['A', 'B', 'C', 'D'])
    expect(indigenas.linhas).toEqual([])
    expect(indigenas.observacao).toContain('à ampla concorrência')
  })

  it('suplentes trazem a modalidade em que concorrem', () => {
    const separada = separarPorVaga(categoria('OUTRAS_COTAS'))!
    expect(separada.suplentes.map((l) => l.numero)).toEqual(['D', 'G'])
    expect(modalidadesDaLinha(separada.suplentes[0], COTAS)).toBe('Ampla concorrência')
  })

  it('sem a vaga registrada, volta à lista única', () => {
    const cat = categoria('OUTRAS_COTAS')
    expect(separarPorVaga({ ...cat, linhas: cat.linhas.map((l) => ({ ...l, vaga: undefined })) })).toBeNull()
    expect(separarPorVaga({ ...cat, cotas: [] })).toBeNull()
  })
})
