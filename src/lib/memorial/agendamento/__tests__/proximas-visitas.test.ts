import { describe, it, expect } from 'vitest'
import type { MemorialStatusAgendamento } from '@prisma/client'
import { separarVisitas } from '../proximas-visitas'

function visita(protocolo: string, dia: string, horaInicio: string, horaFim: string, status: MemorialStatusAgendamento = 'CONFIRMADO') {
  return { protocolo, data: new Date(`${dia}T00:00:00.000Z`), horaInicio, horaFim, status }
}

// 09/10/2026, 14:00 em Irecê (UTC-3).
const AGORA = new Date('2026-10-09T17:00:00.000Z')

describe('separarVisitas', () => {
  it('ordena as próximas da mais perto para a mais longe, independente da ordem de chegada', () => {
    const { proximas } = separarVisitas(
      [visita('C', '2026-10-22', '09:00', '10:00'), visita('B', '2026-10-15', '16:15', '17:15'), visita('A', '2026-10-14', '11:15', '12:15', 'SOLICITADO')],
      AGORA,
    )
    expect(proximas.map((v) => v.protocolo)).toEqual(['A', 'B', 'C'])
  })

  it('no mesmo dia e horário de início, termina antes primeiro e o protocolo desempata', () => {
    const { proximas } = separarVisitas(
      [visita('Z', '2026-10-14', '09:00', '11:00'), visita('Y', '2026-10-14', '09:00', '10:00'), visita('X', '2026-10-14', '09:00', '11:00')],
      AGORA,
    )
    expect(proximas.map((v) => v.protocolo)).toEqual(['Y', 'X', 'Z'])
  })

  it('só pedidos ativos contam como próximos', () => {
    const status: MemorialStatusAgendamento[] = ['SOLICITADO', 'EM_ANALISE', 'REAGENDAMENTO_SOLICITADO', 'CONFIRMADO', 'RECUSADO', 'CANCELADO', 'REALIZADO', 'NAO_COMPARECEU']
    const { proximas } = separarVisitas(status.map((s, i) => visita(s, '2026-10-20', `0${i + 1}:00`, `0${i + 1}:30`, s)), AGORA)
    expect(proximas.map((v) => v.status)).toEqual(['SOLICITADO', 'EM_ANALISE', 'REAGENDAMENTO_SOLICITADO', 'CONFIRMADO'])
  })

  it('decide pelo relógio de Irecê: visita de hoje já encerrada sai, a em andamento fica marcada', () => {
    const { proximas, ultima } = separarVisitas(
      [visita('MANHA', '2026-10-09', '09:00', '10:00'), visita('AGORA', '2026-10-09', '13:30', '14:30'), visita('NOITE', '2026-10-09', '18:00', '19:00')],
      AGORA,
    )
    expect(proximas.map((v) => [v.protocolo, v.emAndamento])).toEqual([
      ['AGORA', true],
      ['NOITE', false],
    ])
    expect(ultima?.protocolo).toBe('MANHA')
  })

  it('não confunde o fuso: 14:30 de Irecê ainda não passou às 17:20 UTC', () => {
    const { proximas } = separarVisitas([visita('X', '2026-10-09', '14:15', '14:30')], new Date('2026-10-09T17:20:00.000Z'))
    expect(proximas).toHaveLength(1)
    const depois = separarVisitas([visita('X', '2026-10-09', '14:15', '14:30')], new Date('2026-10-09T17:31:00.000Z'))
    expect(depois.proximas).toHaveLength(0)
  })

  it('sem nada por vir, a última é a mais recente das passadas', () => {
    const { proximas, ultima } = separarVisitas(
      [visita('VELHA', '2026-08-01', '09:00', '10:00', 'REALIZADO'), visita('RECENTE', '2026-09-30', '09:00', '10:00', 'REALIZADO')],
      AGORA,
    )
    expect(proximas).toEqual([])
    expect(ultima?.protocolo).toBe('RECENTE')
  })

  it('pedido futuro recusado ou cancelado não vira "última visita"', () => {
    const { ultima } = separarVisitas(
      [visita('FEITA', '2026-09-30', '09:00', '10:00', 'REALIZADO'), visita('CANCELADA', '2026-10-22', '09:00', '10:00', 'CANCELADO')],
      AGORA,
    )
    expect(ultima?.protocolo).toBe('FEITA')
    expect(separarVisitas([visita('RECUSADA', '2026-10-22', '09:00', '10:00', 'RECUSADO')], AGORA).ultima).toBeNull()
  })

  it('lista vazia não quebra', () => {
    expect(separarVisitas([], AGORA)).toEqual({ proximas: [], ultima: null })
  })
})
