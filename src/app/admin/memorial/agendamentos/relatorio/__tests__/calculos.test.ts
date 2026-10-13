import { describe, expect, it } from 'vitest'
import { agruparSituacao, ordenarPorHorario, periodoAnterior, variacao } from '../calculos'

describe('periodoAnterior', () => {
  it('devolve o período logo antes, com o mesmo tamanho', () => {
    expect(periodoAnterior('2026-10-01', '2026-10-31')).toEqual({ de: '2026-08-31', ate: '2026-09-30', dias: 31 })
  })

  it('funciona para um dia só', () => {
    expect(periodoAnterior('2026-03-01', '2026-03-01')).toEqual({ de: '2026-02-28', ate: '2026-02-28', dias: 1 })
  })
})

describe('variacao', () => {
  it('calcula o percentual para mais e para menos', () => {
    expect(variacao(150, 100)).toEqual({ tipo: 'mais', percentual: 50 })
    expect(variacao(25, 100)).toEqual({ tipo: 'menos', percentual: 75 })
  })

  it('não inventa percentual quando o período anterior está zerado', () => {
    expect(variacao(10, 0)).toEqual({ tipo: 'sem-base' })
    expect(variacao(0, 0)).toEqual({ tipo: 'nada' })
  })

  it('reconhece valores iguais', () => {
    expect(variacao(7, 7)).toEqual({ tipo: 'igual' })
  })
})

describe('ordenarPorHorario', () => {
  it('põe os horários em ordem do dia sem alterar a lista original', () => {
    const original = [
      { chave: '14:00', visitas: 1, visitantes: 10 },
      { chave: '09:00', visitas: 2, visitantes: 20 },
    ]
    expect(ordenarPorHorario(original).map((g) => g.chave)).toEqual(['09:00', '14:00'])
    expect(original[0].chave).toBe('14:00')
  })
})

describe('agruparSituacao', () => {
  it('reúne os pedidos em aberto num só desfecho e mantém o total', () => {
    const grupos = agruparSituacao({ SOLICITADO: 2, EM_ANALISE: 1, REAGENDAMENTO_SOLICITADO: 1, REALIZADO: 5, RECUSADO: 1 })
    expect(grupos.find((g) => g.grupo === 'aguardando')?.quantidade).toBe(4)
    expect(grupos.reduce((s, g) => s + g.quantidade, 0)).toBe(10)
  })
})
