import { describe, it, expect } from 'vitest'
import { calcularBonusCotas, calcularBonusItens, encontrarCategoriaConfig } from '../bonus'
import type { CategoriaConfig } from '@/types/categoria-config'
import type { ItensBonusConfig } from '@/types/bonus-config'

const categoriaConfig: CategoriaConfig = {
  nome: 'Música I',
  vagasAmplaConcorrencia: 2,
  valorPorProjeto: null,
  valorTotalCategoria: 0,
  cotas: [
    { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1, pontosBonus: 0.5 },
    { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 1, pontosBonus: 0.5 },
    { key: 'sem_bonus', label: 'Cota sem pontuação', vagas: 1 },
  ],
}

describe('calcularBonusCotas', () => {
  it('soma os pontos de cada cota marcada', () => {
    expect(calcularBonusCotas(['negros'], categoriaConfig)).toBe(0.5)
    expect(calcularBonusCotas(['negros', 'indigena_pcd'], categoriaConfig)).toBe(1)
  })

  it('cota sem pontosBonus configurado não soma nada', () => {
    expect(calcularBonusCotas(['sem_bonus'], categoriaConfig)).toBe(0)
  })

  it('cota que não existe na config não soma nada (nunca quebra)', () => {
    expect(calcularBonusCotas(['inexistente'], categoriaConfig)).toBe(0)
  })

  it('sem cotasOptIn ou sem config → zero', () => {
    expect(calcularBonusCotas([], categoriaConfig)).toBe(0)
    expect(calcularBonusCotas(['negros'], null)).toBe(0)
    expect(calcularBonusCotas(['negros'], undefined)).toBe(0)
  })

  it('arredonda pra 2 casas decimais', () => {
    const config: CategoriaConfig = {
      ...categoriaConfig,
      cotas: [
        { key: 'a', label: 'A', vagas: 0, pontosBonus: 0.111 },
        { key: 'b', label: 'B', vagas: 0, pontosBonus: 0.222 },
      ],
    }
    expect(calcularBonusCotas(['a', 'b'], config)).toBe(0.33)
  })
})

describe('encontrarCategoriaConfig', () => {
  const configs = [categoriaConfig, { ...categoriaConfig, nome: 'Música II' }]

  it('encontra pelo nome', () => {
    expect(encontrarCategoriaConfig(configs, 'Música II')?.nome).toBe('Música II')
  })

  it('retorna undefined quando não encontra ou não há config', () => {
    expect(encontrarCategoriaConfig(configs, 'Inexistente')).toBeUndefined()
    expect(encontrarCategoriaConfig(null, 'Música I')).toBeUndefined()
    expect(encontrarCategoriaConfig(configs, null)).toBeUndefined()
  })
})

describe('calcularBonusItens', () => {
  const config: ItensBonusConfig = {
    maxItens: 2,
    itens: [
      { key: 'genero_lgbtqia', label: 'Gênero feminino ou LGBTQIA+', pontos: 5 },
      { key: 'etnico_racial', label: 'Negros e indígenas', pontos: 5 },
      { key: 'pcd', label: 'Pessoa com deficiência', pontos: 5 },
    ],
  }

  it('soma os itens validados pela comissão', () => {
    expect(calcularBonusItens(['genero_lgbtqia', 'etnico_racial'], config)).toBe(10)
  })

  it('respeita o teto de itens do edital, mantendo os de maior pontuação', () => {
    const pesos: ItensBonusConfig = {
      maxItens: 2,
      itens: [
        { key: 'a', label: 'A', pontos: 2 },
        { key: 'b', label: 'B', pontos: 5 },
        { key: 'c', label: 'C', pontos: 3 },
      ],
    }
    expect(calcularBonusItens(['a', 'b', 'c'], pesos)).toBe(8)
  })

  it('sem teto configurado soma tudo', () => {
    expect(calcularBonusItens(['genero_lgbtqia', 'etnico_racial', 'pcd'], { ...config, maxItens: null })).toBe(15)
  })

  it('chave repetida conta uma vez só', () => {
    expect(calcularBonusItens(['pcd', 'pcd'], config)).toBe(5)
  })

  it('chave fora da config do edital não soma', () => {
    expect(calcularBonusItens(['inexistente'], config)).toBe(0)
  })

  it('sem itens marcados ou sem config → 0', () => {
    expect(calcularBonusItens([], config)).toBe(0)
    expect(calcularBonusItens(['pcd'], null)).toBe(0)
  })
})
