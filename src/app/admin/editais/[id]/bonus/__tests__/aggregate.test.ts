import { describe, it, expect } from 'vitest'
import { montarLinhasBonus, agregarPorCota } from '../aggregate'
import type { ResultadoInscricao } from '@/lib/results/calculate'
import type { CategoriaConfig } from '@/types/categoria-config'

const categoriasConfig: CategoriaConfig[] = [
  {
    nome: 'Música',
    vagasAmplaConcorrencia: 1,
    valorPorProjeto: null,
    valorTotalCategoria: 0,
    cotas: [
      { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1, pontosBonus: 0.5 },
      { key: 'pcd', label: 'PCD', vagas: 1, pontosBonus: 0.3 },
    ],
  },
]

function resultado(overrides: Partial<ResultadoInscricao>): ResultadoInscricao {
  return {
    inscricaoId: 'i1',
    proponenteNome: 'Ana',
    categoria: 'Música',
    cotasOptIn: [],
    notaFinal: 7,
    notaBonus: 0,
    totalAvaliacoes: 2,
    ...overrides,
  }
}

describe('montarLinhasBonus', () => {
  it('filtra fora inscrições sem bônus', () => {
    const resultados = [resultado({ notaBonus: 0 })]
    expect(montarLinhasBonus(resultados, categoriasConfig)).toHaveLength(0)
  })

  it('monta a linha com notaBase derivada (notaFinal - notaBonus) e cotas resolvidas', () => {
    const resultados = [
      resultado({ inscricaoId: 'i1', cotasOptIn: ['negros'], notaFinal: 7.5, notaBonus: 0.5 }),
    ]
    const linhas = montarLinhasBonus(resultados, categoriasConfig)
    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toMatchObject({
      inscricaoId: 'i1',
      notaBase: 7,
      notaBonus: 0.5,
      notaComBonus: 7.5,
      cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', pontos: 0.5 }],
    })
  })

  it('soma múltiplas cotas na mesma inscrição', () => {
    const resultados = [
      resultado({ inscricaoId: 'i1', cotasOptIn: ['negros', 'pcd'], notaFinal: 7.8, notaBonus: 0.8 }),
    ]
    const linhas = montarLinhasBonus(resultados, categoriasConfig)
    expect(linhas[0].cotas).toHaveLength(2)
  })

  it('ordena por bônus descendente', () => {
    const resultados = [
      resultado({ inscricaoId: 'baixo', cotasOptIn: ['pcd'], notaFinal: 7.3, notaBonus: 0.3 }),
      resultado({ inscricaoId: 'alto', cotasOptIn: ['negros'], notaFinal: 7.5, notaBonus: 0.5 }),
    ]
    const linhas = montarLinhasBonus(resultados, categoriasConfig)
    expect(linhas[0].inscricaoId).toBe('alto')
  })

  it('categoria sem config conhecida não quebra — cotas ficam vazias', () => {
    const resultados = [
      resultado({ categoria: 'Inexistente', cotasOptIn: ['negros'], notaBonus: 0.5 }),
    ]
    expect(() => montarLinhasBonus(resultados, categoriasConfig)).not.toThrow()
  })
})

describe('agregarPorCota', () => {
  it('soma pontos e conta inscrições por cota', () => {
    const linhas = montarLinhasBonus(
      [
        resultado({ inscricaoId: 'i1', cotasOptIn: ['negros'], notaFinal: 7.5, notaBonus: 0.5 }),
        resultado({ inscricaoId: 'i2', cotasOptIn: ['negros'], notaFinal: 8.5, notaBonus: 0.5 }),
        resultado({ inscricaoId: 'i3', cotasOptIn: ['pcd'], notaFinal: 6.3, notaBonus: 0.3 }),
      ],
      categoriasConfig,
    )
    const agregado = agregarPorCota(linhas)
    expect(agregado).toEqual([
      { key: 'negros', label: 'Cotas Pessoas Negras', inscricoes: 2, totalPontos: 1 },
      { key: 'pcd', label: 'PCD', inscricoes: 1, totalPontos: 0.3 },
    ])
  })

  it('lista vazia → agregado vazio', () => {
    expect(agregarPorCota([])).toEqual([])
  })
})
