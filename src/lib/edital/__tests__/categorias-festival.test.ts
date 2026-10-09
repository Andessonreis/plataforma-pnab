import { describe, it, expect } from 'vitest'
import { CATEGORIAS_CONFIG_FESTIVAL, vagasInfoDaCategoria } from '../categorias-festival'
import { CATEGORIAS_HABILITACAO_FESTIVAL } from '../dados-habilitados-festival'

describe('vagas e valores do Festival', () => {
  it('soma ampla concorrência e cotas e formata o valor por projeto', () => {
    expect(vagasInfoDaCategoria('Audiovisual/Cinema')).toMatch(/^4 vagas · R\$\s2\.000,00 por projeto$/)
    expect(vagasInfoDaCategoria('Cultura Hip Hop/Batalha de Rua')).toMatch(/^1 vaga · R\$\s5\.000,00 por projeto$/)
  })

  it('rejeita categoria sem vagas/valor fixos', () => {
    expect(() => vagasInfoDaCategoria('Outros Serviços de Terceiros - Pessoa Jurídica')).toThrow()
  })

  it('toda categoria da relação de habilitados usa vagas e valor da configuração do edital', () => {
    for (const cat of CATEGORIAS_HABILITACAO_FESTIVAL) {
      const config = CATEGORIAS_CONFIG_FESTIVAL.find((c) => c.nome === cat.nome)
      expect(config, cat.nome).toBeDefined()
      expect(cat.vagasInfo).toBe(vagasInfoDaCategoria(cat.nome))
    }
  })

  it('nenhuma categoria tem mais habilitados que vagas', () => {
    for (const cat of CATEGORIAS_HABILITACAO_FESTIVAL) {
      const vagas = Number(cat.vagasInfo.split(' ')[0])
      expect(cat.propostas.filter((p) => p.habilitado).length, cat.nome).toBeLessThanOrEqual(vagas)
    }
  })
})
