import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'
import { viewNotaTotal, formatNotaTotal, viewNotaTotalSemBonusCriterio } from '../avaliacao-view'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'

describe('viewNotaTotal', () => {
  it('retorna null quando finalizada=false', () => {
    expect(viewNotaTotal({ notaTotal: 7.5, finalizada: false })).toBeNull()
  })

  it('retorna null quando notaTotal=null mesmo com finalizada=true', () => {
    expect(viewNotaTotal({ notaTotal: null, finalizada: true })).toBeNull()
  })

  it('retorna null quando notaTotal=undefined', () => {
    expect(viewNotaTotal({ notaTotal: undefined, finalizada: true })).toBeNull()
  })

  it('retorna número quando finalizada=true e nota numérica', () => {
    expect(viewNotaTotal({ notaTotal: 8.5, finalizada: true })).toBe(8.5)
  })

  it('retorna 0 (e não null) quando avaliador realmente atribuiu nota 0', () => {
    expect(viewNotaTotal({ notaTotal: 0, finalizada: true })).toBe(0)
  })

  it('aceita Decimal do Prisma (string)', () => {
    expect(viewNotaTotal({ notaTotal: '9.57', finalizada: true })).toBe(9.57)
  })

  it('aceita Prisma.Decimal', () => {
    expect(viewNotaTotal({ notaTotal: new Prisma.Decimal('7.65'), finalizada: true })).toBe(7.65)
  })

  it('retorna null para valores inválidos', () => {
    expect(viewNotaTotal({ notaTotal: 'abc', finalizada: true })).toBeNull()
  })
})

describe('formatNotaTotal', () => {
  it("retorna 'Pendente' para placeholder", () => {
    expect(formatNotaTotal({ notaTotal: null, finalizada: false })).toBe('Pendente')
  })

  it("retorna 'Pendente' para rascunho não finalizado", () => {
    expect(formatNotaTotal({ notaTotal: 7.7, finalizada: false })).toBe('Pendente')
  })

  it('formata nota com 2 casas por padrão', () => {
    expect(formatNotaTotal({ notaTotal: 8.5, finalizada: true })).toBe('8.50')
  })

  it('aceita decimals customizado', () => {
    expect(formatNotaTotal({ notaTotal: 8.5, finalizada: true }, 1)).toBe('8.5')
  })

  it('formata 0 quando avaliação real foi zerada', () => {
    expect(formatNotaTotal({ notaTotal: 0, finalizada: true })).toBe('0.00')
  })
})

describe('viewNotaTotalSemBonusCriterio', () => {
  const criterios: CriterioAvaliacao[] = [
    { criterio: 'A) Qualidade do Projeto', peso: 30, notaMax: 30, bloco: 'Bloco 1' },
    { criterio: 'E) Coerência do Plano de Divulgação', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
    { criterio: 'Bonificação — Gênero feminino ou LGBTQIA+', peso: 5, notaMax: 5, bloco: 'Bloco 2 — Bonificação' },
  ]
  const formula = '(B1/10)+(B2/10)'

  it('retorna null quando nao finalizada', () => {
    const av = { finalizada: false, notaTotal: 7.1, notas: [] }
    expect(viewNotaTotalSemBonusCriterio(av, criterios, formula)).toBeNull()
  })

  it('recalcula a nota descontando o bonus — caso real que gerou confusao no admin', () => {
    // Bloco 1 = 22+6 = 28 (nota real usava mais criterios, aqui simplificado);
    // com bonus de 5 a nota total seria (28/10)+(5/10) = 3.3; sem o bonus,
    // (28/10)+(0/10) = 2.8 — o admin ve so essa parte, entao a nota exibida
    // precisa bater com o que ele consegue conferir na tabela.
    const av = {
      finalizada: true,
      notaTotal: 3.3,
      notas: [
        { criterio: 'A) Qualidade do Projeto', nota: 22, peso: 30 },
        { criterio: 'E) Coerência do Plano de Divulgação', nota: 6, peso: 10 },
        { criterio: 'Bonificação — Gênero feminino ou LGBTQIA+', nota: 5, peso: 5 },
      ],
    }
    expect(viewNotaTotalSemBonusCriterio(av, criterios, formula)).toBe(2.8)
  })

  it('bate com a nota real quando o avaliador nao deu bonus', () => {
    const av = {
      finalizada: true,
      notaTotal: 2.8,
      notas: [
        { criterio: 'A) Qualidade do Projeto', nota: 22, peso: 30 },
        { criterio: 'E) Coerência do Plano de Divulgação', nota: 6, peso: 10 },
        { criterio: 'Bonificação — Gênero feminino ou LGBTQIA+', nota: 0, peso: 5 },
      ],
    }
    expect(viewNotaTotalSemBonusCriterio(av, criterios, formula)).toBe(2.8)
  })
})
