import { describe, it, expect } from 'vitest'
import { chegouHa, diasEntreDias, faltaPara } from '@/app/admin/memorial/_ui/agenda-tempo'
import { conflitosDaVisita, type VisitaDoDia } from '../[id]/conflitos'

describe('agenda-tempo', () => {
  it('conta dias corridos entre dois dias', () => {
    expect(diasEntreDias('2026-10-09', '2026-10-12')).toBe(3)
    expect(diasEntreDias('2026-10-12', '2026-10-09')).toBe(-3)
  })

  it('diz há quanto tempo o pedido chegou, no dia de Irecê', () => {
    const agora = new Date('2026-10-09T15:00:00Z')
    expect(chegouHa(new Date('2026-10-09T11:00:00Z'), agora)).toBe('Chegou hoje')
    // 01h UTC do dia 9 ainda é dia 8 em Irecê
    expect(chegouHa(new Date('2026-10-09T01:00:00Z'), agora)).toBe('Chegou ontem')
    expect(chegouHa(new Date('2026-10-05T12:00:00Z'), agora)).toBe('Chegou há 4 dias')
  })

  it('diz quanto falta para a visita e cala quando já passou', () => {
    expect(faltaPara('2026-10-09', '2026-10-09')).toBe('hoje')
    expect(faltaPara('2026-10-10', '2026-10-09')).toBe('amanhã')
    expect(faltaPara('2026-10-15', '2026-10-09')).toBe('em 6 dias')
    expect(faltaPara('2026-10-01', '2026-10-09')).toBe('')
  })
})

const visita = (p: Partial<VisitaDoDia>): VisitaDoDia => ({
  id: 'a',
  instituicao: 'Escola A',
  turno: 'MANHA',
  horaInicio: '09:00',
  status: 'SOLICITADO',
  ...p,
})
const regras = { maxGruposPorDia: 2, umTurnoPorDia: true }

describe('conflitosDaVisita', () => {
  it('sem outros grupos não há aviso', () => {
    expect(conflitosDaVisita(visita({}), [visita({})], regras)).toEqual([])
  })

  it('aponta outro grupo no mesmo horário', () => {
    const r = conflitosDaVisita(visita({}), [visita({ id: 'b', instituicao: 'Escola B', status: 'CONFIRMADO' })], regras)
    expect(r).toHaveLength(1)
    expect(r[0]).toContain('Escola B também está marcada para as 09:00')
  })

  it('aponta grupo no outro turno quando a regra é um turno por dia', () => {
    const r = conflitosDaVisita(visita({}), [visita({ id: 'b', turno: 'TARDE', horaInicio: '14:00', status: 'CONFIRMADO' })], regras)
    expect(r.join(' ')).toContain('turno da tarde')
  })

  it('aponta dia acima do limite de grupos', () => {
    const outras = [visita({ id: 'b', horaInicio: '10:00' }), visita({ id: 'c', horaInicio: '11:00' })]
    expect(conflitosDaVisita(visita({}), outras, regras).join(' ')).toContain('limite de 2 grupos')
  })

  it('ignora visitas que já liberaram o horário e visitas encerradas', () => {
    expect(conflitosDaVisita(visita({}), [visita({ id: 'b', status: 'RECUSADO' })], regras)).toEqual([])
    expect(conflitosDaVisita(visita({ status: 'REALIZADO' }), [visita({ id: 'b', status: 'CONFIRMADO' })], regras)).toEqual([])
  })
})
