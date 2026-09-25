import { describe, it, expect } from 'vitest'
import type { LinhaResultadoPublico } from '@/lib/results/resultado-publico'
import type { CategoriaConfig } from '@/types/categoria-config'
import { agruparPorCategoria } from '../agrupar-por-categoria'

function linha(numero: string, categoria: string | null, posicao: number | null): LinhaResultadoPublico {
  return { numero, posicao, proponente: 'PROPONENTE', categoria, nota: '80.00', situacao: 'SUPLENTE' }
}

const CONFIG: CategoriaConfig[] = [{
  nome: 'Arte Visual/Exposição',
  vagasAmplaConcorrencia: 2,
  cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }],
  valorPorProjeto: 7000,
  valorTotalCategoria: 21000,
}]

describe('agruparPorCategoria', () => {
  it('separa por categoria, em ordem alfabética, mantendo a ordem das linhas dentro de cada uma', () => {
    const grupos = agruparPorCategoria(
      [linha('A1', 'Teatro', 1), linha('A2', 'Teatro', 2), linha('B1', 'Dança', 1), linha('C1', 'Ópera', 1)],
      null,
    )
    expect(grupos.map((g) => [g.nome, g.linhas.map((l) => l.numero)])).toEqual([
      ['Dança', ['B1']],
      ['Ópera', ['C1']],
      ['Teatro', ['A1', 'A2']],
    ])
  })

  it('gera âncora sem acento, espaço nem barra', () => {
    const [grupo] = agruparPorCategoria([linha('A1', 'Arte Visual/Exposição', 1)], null)
    expect(grupo.ancora).toBe('categoria-arte-visual-exposicao')
  })

  it('junta o quadro de vagas quando o edital configura a categoria', () => {
    const grupos = agruparPorCategoria([linha('A1', 'Arte Visual/Exposição', 1), linha('B1', 'Teatro', 1)], CONFIG)
    // O formatador de moeda separa "R$" do valor com espaço sem quebra.
    expect(grupos[0].quadroDeVagas?.replace(/\u00a0/g, ' ')).toBe(
      '2 vaga(s) de ampla concorrência · Cotas Pessoas Negras: 1 · R$ 7.000,00 por projeto',
    )
    expect(grupos[1].quadroDeVagas).toBeNull()
  })

  it('agrupa quem não tem categoria numa seção própria', () => {
    const [grupo] = agruparPorCategoria([linha('A1', null, null)], null)
    expect(grupo.nome).toBe('Sem categoria')
  })
})
