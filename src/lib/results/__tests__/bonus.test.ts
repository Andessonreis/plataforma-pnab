import { describe, it, expect } from 'vitest'
import { calcularBonusCotas, encontrarCategoriaConfig } from '../bonus'
import type { CategoriaConfig } from '@/types/categoria-config'

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
