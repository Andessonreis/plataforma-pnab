import { describe, it, expect } from 'vitest'
import { juntarAntecedencia, pedidosForaDaGrade, proximaFaixa, resumoTurno, separarAntecedencia } from '../regras-visita'

describe('antecedência em dias e horas', () => {
  it('ida e volta preservam o total em horas', () => {
    expect(separarAntecedencia(50)).toEqual({ dias: 2, horas: 2 })
    expect(juntarAntecedencia(2, 2)).toBe(50)
    expect(juntarAntecedencia(-1, 3)).toBe(3)
  })
})

describe('horários de um turno', () => {
  it('sugere a próxima faixa a partir do fim da última, com a mesma duração', () => {
    expect(proximaFaixa([{ inicio: '09:00', fim: '09:45' }], '09:00')).toEqual({ inicio: '09:45', fim: '10:30' })
  })

  it('turno vazio começa no horário padrão', () => {
    expect(proximaFaixa([], '14:00')).toEqual({ inicio: '14:00', fim: '14:45' })
  })

  it('não passa da meia-noite', () => {
    expect(proximaFaixa([{ inicio: '23:00', fim: '23:45' }], '09:00').fim).toBe('23:59')
  })

  it('resume o turno do primeiro início ao último fim', () => {
    expect(resumoTurno([{ inicio: '09:45', fim: '10:30' }, { inicio: '09:00', fim: '09:45' }])).toBe('09:00 às 10:30')
    expect(resumoTurno([])).toBeNull()
  })
})

describe('pedidos futuros fora da grade em edição', () => {
  const grade = { diasSemana: [1, 2, 3, 4, 5], horarios: { MANHA: [{ inicio: '09:00', fim: '09:45' }], TARDE: [] } }
  it('conta horário retirado e dia da semana fechado', () => {
    const pedidos = [
      { data: '2026-10-15', turno: 'MANHA' as const, horaInicio: '09:00' },
      { data: '2026-10-15', turno: 'MANHA' as const, horaInicio: '10:30' },
      { data: '2026-10-15', turno: 'TARDE' as const, horaInicio: '14:00' },
      { data: '2026-10-17', turno: 'MANHA' as const, horaInicio: '09:00' },
    ]
    expect(pedidosForaDaGrade(pedidos, grade)).toBe(3)
    expect(pedidosForaDaGrade(pedidos.slice(0, 1), grade)).toBe(0)
  })
})
