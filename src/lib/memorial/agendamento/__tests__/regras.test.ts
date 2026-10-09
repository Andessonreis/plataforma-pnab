import { describe, it, expect } from 'vitest'
import { CONFIG_PADRAO } from '@/lib/memorial/config'
import {
  cabeNoGrupo,
  cumpreAntecedencia,
  diaAbertoParaVisita,
  diaLotado,
  horarioDaGrade,
  horarioOcupado,
  motivoIndisponivel,
  ocupaVaga,
  ocupacoesDoDia,
  turnoBloqueado,
  STATUS_QUE_OCUPAM,
  type MotivoIndisponivel,
  type Ocupacao,
  type RegrasVisita,
} from '../regras'

const REGRAS: RegrasVisita = CONFIG_PADRAO.visitacao
// Segunda-feira, 12/10/2026, 10h em Irecê (13h UTC)
const AGORA = new Date('2026-10-12T13:00:00.000Z')
// Quinta-feira, bem depois das 48h
const QUINTA = '2026-10-15'

const pedido = (extra: Partial<Parameters<typeof motivoIndisponivel>[0]> = {}) => ({
  data: QUINTA,
  turno: 'MANHA' as const,
  horaInicio: '09:00',
  horaFim: '09:45',
  quantidade: 15,
  ...extra,
})

const ocup = (extra: Partial<Ocupacao> = {}): Ocupacao => ({
  data: QUINTA,
  turno: 'MANHA',
  horaInicio: '09:45',
  status: 'CONFIRMADO',
  ...extra,
})

describe('ocupaVaga', () => {
  it.each(['SOLICITADO', 'EM_ANALISE', 'CONFIRMADO', 'REAGENDAMENTO_SOLICITADO'] as const)('%s segura vaga', (s) => {
    expect(ocupaVaga(s)).toBe(true)
  })
  it.each(['RECUSADO', 'CANCELADO', 'REALIZADO', 'NAO_COMPARECEU'] as const)('%s libera a vaga', (s) => {
    expect(ocupaVaga(s)).toBe(false)
  })
  it('lista exatamente os quatro status que ocupam', () => {
    expect([...STATUS_QUE_OCUPAM].sort()).toEqual(['CONFIRMADO', 'EM_ANALISE', 'REAGENDAMENTO_SOLICITADO', 'SOLICITADO'])
  })
})

describe('cumpreAntecedencia', () => {
  it('exatamente 48h antes vale', () => {
    // 14/10 às 10h em Irecê = 48h depois de AGORA
    expect(cumpreAntecedencia('2026-10-14', '10:00', AGORA, 48)).toBe(true)
  })
  it('um minuto a menos não vale', () => {
    expect(cumpreAntecedencia('2026-10-14', '09:59', AGORA, 48)).toBe(false)
  })
  it('usa o fuso de Irecê, não UTC', () => {
    // 14/10 09:45 em Irecê é 12:45 UTC — 47h45 depois de AGORA
    expect(cumpreAntecedencia('2026-10-14', '09:45', AGORA, 48)).toBe(false)
  })
  it('antecedência zero aceita qualquer horário futuro e recusa o passado', () => {
    expect(cumpreAntecedencia('2026-10-12', '10:30', AGORA, 0)).toBe(true)
    expect(cumpreAntecedencia('2026-10-12', '09:00', AGORA, 0)).toBe(false)
  })
})

describe('cabeNoGrupo', () => {
  it.each([
    [1, true],
    [20, true],
    [21, false],
    [0, false],
    [-3, false],
    [2.5, false],
  ])('%d pessoas → %s', (qtd, esperado) => {
    expect(cabeNoGrupo(qtd, 20)).toBe(esperado)
  })
})

describe('diaAbertoParaVisita', () => {
  it('aceita dias úteis e recusa fim de semana no padrão', () => {
    expect(diaAbertoParaVisita('2026-10-12', REGRAS.diasSemana)).toBe(true) // segunda
    expect(diaAbertoParaVisita('2026-10-16', REGRAS.diasSemana)).toBe(true) // sexta
    expect(diaAbertoParaVisita('2026-10-17', REGRAS.diasSemana)).toBe(false) // sábado
    expect(diaAbertoParaVisita('2026-10-18', REGRAS.diasSemana)).toBe(false) // domingo
  })
  it('respeita a lista configurada', () => {
    expect(diaAbertoParaVisita('2026-10-17', [6])).toBe(true)
    expect(diaAbertoParaVisita('2026-10-12', [6])).toBe(false)
  })
})

describe('horarioDaGrade', () => {
  it('aceita início e fim exatos da grade', () => {
    expect(horarioDaGrade({ turno: 'TARDE', horaInicio: '14:45', horaFim: '15:30' }, REGRAS.horarios)).toBe(true)
  })
  it('recusa horário de outro turno, fim trocado ou fora da grade', () => {
    expect(horarioDaGrade({ turno: 'MANHA', horaInicio: '14:45', horaFim: '15:30' }, REGRAS.horarios)).toBe(false)
    expect(horarioDaGrade({ turno: 'MANHA', horaInicio: '09:00', horaFim: '10:30' }, REGRAS.horarios)).toBe(false)
    expect(horarioDaGrade({ turno: 'MANHA', horaInicio: '08:00', horaFim: '08:45' }, REGRAS.horarios)).toBe(false)
  })
})

describe('ocupações do dia', () => {
  const lista = [
    ocup(),
    ocup({ status: 'CANCELADO', horaInicio: '10:30' }),
    ocup({ data: '2026-10-16' }),
  ]
  it('filtra pelo dia e descarta status que liberam vaga', () => {
    expect(ocupacoesDoDia(lista, QUINTA)).toHaveLength(1)
  })
  it('diaLotado compara com o limite', () => {
    expect(diaLotado([ocup()], 2)).toBe(false)
    expect(diaLotado([ocup(), ocup({ horaInicio: '10:30' })], 2)).toBe(true)
  })
  it('turnoBloqueado só vale com a regra de um turno ligada', () => {
    expect(turnoBloqueado([ocup()], 'TARDE', true)).toBe(true)
    expect(turnoBloqueado([ocup()], 'MANHA', true)).toBe(false)
    expect(turnoBloqueado([ocup()], 'TARDE', false)).toBe(false)
    expect(turnoBloqueado([], 'TARDE', true)).toBe(false)
  })
  it('tarde ocupada fecha a manhã (e vice-versa)', () => {
    expect(turnoBloqueado([ocup({ turno: 'TARDE', horaInicio: '14:00' })], 'MANHA', true)).toBe(true)
  })
  it('horarioOcupado compara turno e início', () => {
    expect(horarioOcupado([ocup()], 'MANHA', '09:45')).toBe(true)
    expect(horarioOcupado([ocup()], 'MANHA', '09:00')).toBe(false)
    expect(horarioOcupado([ocup()], 'TARDE', '09:45')).toBe(false)
  })
})

describe('motivoIndisponivel', () => {
  it('pedido válido em dia livre passa', () => {
    expect(motivoIndisponivel(pedido(), [], REGRAS, AGORA)).toBeNull()
  })

  const casos: [string, Parameters<typeof motivoIndisponivel>[0], Ocupacao[], MotivoIndisponivel][] = [
    ['grupo acima do limite', pedido({ quantidade: 21 }), [], 'GRUPO_GRANDE'],
    ['sábado', pedido({ data: '2026-10-17' }), [], 'DIA_FECHADO'],
    ['horário fora da grade', pedido({ horaInicio: '08:00', horaFim: '08:45' }), [], 'FORA_DA_GRADE'],
    ['menos de 48h', pedido({ data: '2026-10-13' }), [], 'ANTECEDENCIA'],
    ['mesmo horário já pedido', pedido(), [ocup({ horaInicio: '09:00', status: 'SOLICITADO' })], 'HORARIO_OCUPADO'],
    ['dia com dois grupos', pedido(), [ocup(), ocup({ horaInicio: '10:30', status: 'EM_ANALISE' })], 'DIA_LOTADO'],
    ['tarde já tem visita', pedido(), [ocup({ turno: 'TARDE', horaInicio: '14:00' })], 'OUTRO_TURNO_OCUPADO'],
    ['reagendamento pedido também ocupa', pedido(), [ocup({ horaInicio: '09:00', status: 'REAGENDAMENTO_SOLICITADO' })], 'HORARIO_OCUPADO'],
  ]
  it.each(casos)('%s', (_n, p, ocupacoes, esperado) => {
    expect(motivoIndisponivel(p, ocupacoes, REGRAS, AGORA)).toBe(esperado)
  })

  it('visita cancelada no mesmo horário não bloqueia', () => {
    expect(motivoIndisponivel(pedido(), [ocup({ horaInicio: '09:00', status: 'CANCELADO' })], REGRAS, AGORA)).toBeNull()
  })
  it('a equipe pode ignorar a antecedência', () => {
    expect(motivoIndisponivel(pedido({ data: '2026-10-13' }), [], REGRAS, AGORA, { ignorarAntecedencia: true })).toBeNull()
  })
  it('com dois turnos liberados, a tarde fica livre mesmo com manhã ocupada', () => {
    const regras = { ...REGRAS, umTurnoPorDia: false }
    expect(motivoIndisponivel(pedido({ turno: 'TARDE', horaInicio: '14:00', horaFim: '14:45' }), [ocup()], regras, AGORA)).toBeNull()
  })
  it('limite de grupos configurável', () => {
    const regras = { ...REGRAS, maxGruposPorDia: 1 }
    expect(motivoIndisponivel(pedido(), [ocup()], regras, AGORA)).toBe('DIA_LOTADO')
  })
})
