import { describe, it, expect } from 'vitest'
import { parseItensBonus, invalidBonusItens } from '../bonus-config'

const configValida = {
  maxItens: 2,
  itens: [
    { key: 'genero_lgbtqia', label: 'Gênero feminino ou LGBTQIA+', pontos: 5 },
    { key: 'etnico_racial', label: 'Negros e indígenas', pontos: 5 },
  ],
}

describe('parseItensBonus', () => {
  it('lê a config do edital', () => {
    expect(parseItensBonus(configValida)).toEqual(configValida)
  })

  it('aceita JSON em string', () => {
    expect(parseItensBonus(JSON.stringify(configValida))).toEqual(configValida)
  })

  it('edital sem bonificação → null', () => {
    expect(parseItensBonus(null)).toBeNull()
    expect(parseItensBonus({})).toBeNull()
    expect(parseItensBonus({ maxItens: 2, itens: [] })).toBeNull()
    expect(parseItensBonus('não é json')).toBeNull()
  })

  it('descarta itens malformados', () => {
    const config = parseItensBonus({
      maxItens: 2,
      itens: [
        { key: 'ok', label: 'Ok', pontos: 5 },
        { key: '', label: 'Sem chave', pontos: 5 },
        { key: 'sem_pontos', label: 'Sem pontos' },
      ],
    })
    expect(config?.itens).toEqual([{ key: 'ok', label: 'Ok', pontos: 5 }])
  })

  it('maxItens inválido vira null (sem teto) em vez de derrubar a config', () => {
    expect(parseItensBonus({ ...configValida, maxItens: 0 })?.maxItens).toBeNull()
    expect(parseItensBonus({ ...configValida, maxItens: 'dois' })?.maxItens).toBeNull()
  })
})

describe('invalidBonusItens', () => {
  it('aponta as chaves que não existem no edital', () => {
    const config = parseItensBonus(configValida)
    expect(invalidBonusItens(config, ['etnico_racial', 'pcd'])).toEqual(['pcd'])
    expect(invalidBonusItens(config, [])).toEqual([])
    expect(invalidBonusItens(null, ['etnico_racial'])).toEqual(['etnico_racial'])
  })
})
