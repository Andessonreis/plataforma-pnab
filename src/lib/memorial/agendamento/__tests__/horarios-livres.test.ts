import { describe, it, expect } from 'vitest'
import { CONFIG_PADRAO } from '@/lib/memorial/config'
import { horariosLivres, mensagemIndisponivel, rotuloMotivoHorario, situacaoDosHorarios, type Ocupacao, type RegrasVisita } from '../regras'

const REGRAS: RegrasVisita = CONFIG_PADRAO.visitacao
// Segunda-feira, 12/10/2026, 10h em Irecê (13h UTC)
const AGORA = new Date('2026-10-12T13:00:00.000Z')
const QUINTA = '2026-10-15'

const ocup = (extra: Partial<Ocupacao> = {}): Ocupacao => ({
  data: QUINTA,
  turno: 'MANHA',
  horaInicio: '09:45',
  status: 'CONFIRMADO',
  ...extra,
})

describe('horariosLivres', () => {
  it('dia livre devolve a grade inteira dos dois turnos', () => {
    expect(horariosLivres(QUINTA, [], REGRAS, AGORA)).toHaveLength(8)
  })
  it('manhã ocupada esconde a tarde e o horário tomado', () => {
    const livres = horariosLivres(QUINTA, [ocup()], REGRAS, AGORA)
    expect(livres.map((h) => h.inicio)).toEqual(['09:00', '10:30', '11:15'])
    expect(livres.every((h) => h.turno === 'MANHA')).toBe(true)
  })
  it('dia lotado não tem horário', () => {
    expect(horariosLivres(QUINTA, [ocup(), ocup({ horaInicio: '10:30' })], REGRAS, AGORA)).toEqual([])
  })
  it('fim de semana não tem horário', () => {
    expect(horariosLivres('2026-10-17', [], REGRAS, AGORA)).toEqual([])
  })
  it('corta os horários que não cumprem a antecedência', () => {
    // 14/10: só a partir das 10h fecha as 48h
    const livres = horariosLivres('2026-10-14', [], REGRAS, AGORA)
    expect(livres[0]).toEqual({ turno: 'MANHA', inicio: '10:30', fim: '11:15' })
  })
})

describe('situacaoDosHorarios', () => {
  const motivos = (ocupacoes: Ocupacao[], regras = REGRAS, dia = QUINTA) =>
    Object.fromEntries(situacaoDosHorarios(dia, ocupacoes, regras, AGORA).map((h) => [h.inicio, h.motivo]))

  it('dia com um pedido de manhã ainda oferece os outros horários da manhã', () => {
    const m = motivos([ocup({ horaInicio: '11:15', status: 'SOLICITADO' })])
    expect(m['11:15']).toBe('RESERVADO')
    expect([m['09:00'], m['09:45'], m['10:30']]).toEqual([null, null, null])
  })

  it('com turno único, a tarde aparece bloqueada com o motivo em vez de sumir', () => {
    const grade = situacaoDosHorarios(QUINTA, [ocup()], REGRAS, AGORA)
    expect(grade).toHaveLength(8)
    const tarde = grade.filter((h) => h.turno === 'TARDE')
    expect(tarde.every((h) => h.motivo === 'OUTRO_TURNO')).toBe(true)
    expect(rotuloMotivoHorario('OUTRO_TURNO', 'TARDE')).toBe('Turno da manhã já tem visita')
  })

  it('sem turno único, a tarde continua livre', () => {
    const m = motivos([ocup()], { ...REGRAS, umTurnoPorDia: false })
    expect(m['14:00']).toBeNull()
  })

  it('o dia só fica sem horário livre quando nada sobra (limite de grupos)', () => {
    const grade = situacaoDosHorarios(QUINTA, [ocup(), ocup({ horaInicio: '10:30' })], REGRAS, AGORA)
    expect(grade.some((h) => h.motivo === null)).toBe(false)
    expect(grade.filter((h) => h.motivo === 'DIA_LOTADO').map((h) => h.inicio)).toEqual(['09:00', '11:15', '14:00', '14:45', '15:30', '16:15'])
    expect(rotuloMotivoHorario('DIA_LOTADO', 'MANHA')).toBe('Limite de grupos no dia')
  })

  it('com limite maior, o mesmo dia aceita outro grupo em horário diferente', () => {
    const m = motivos([ocup(), ocup({ horaInicio: '10:30' })], { ...REGRAS, maxGruposPorDia: 3 })
    expect([m['09:00'], m['11:15']]).toEqual([null, null])
  })

  it('pedidos recusados ou cancelados liberam o horário', () => {
    const m = motivos([ocup({ status: 'CANCELADO' }), ocup({ horaInicio: '10:30', status: 'RECUSADO' })])
    expect(Object.values(m).every((v) => v === null)).toBe(true)
  })

  it('dia fechado devolve grade vazia', () => {
    expect(situacaoDosHorarios('2026-10-18', [], REGRAS, AGORA)).toEqual([])
  })
})

describe('mensagemIndisponivel', () => {
  it('usa os números da configuração', () => {
    expect(mensagemIndisponivel('ANTECEDENCIA', { ...REGRAS, antecedenciaHoras: 72 })).toContain('72 horas')
    expect(mensagemIndisponivel('GRUPO_GRANDE', { ...REGRAS, maxPessoasPorGrupo: 30 })).toContain('30 pessoas')
  })
})
