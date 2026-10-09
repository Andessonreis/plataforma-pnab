import { describe, it, expect } from 'vitest'
import { CONFIG_PADRAO } from '@/lib/memorial/config'
import { horariosLivres, mensagemIndisponivel, type Ocupacao, type RegrasVisita } from '../regras'

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

describe('mensagemIndisponivel', () => {
  it('usa os números da configuração', () => {
    expect(mensagemIndisponivel('ANTECEDENCIA', { ...REGRAS, antecedenciaHoras: 72 })).toContain('72 horas')
    expect(mensagemIndisponivel('GRUPO_GRANDE', { ...REGRAS, maxPessoasPorGrupo: 30 })).toContain('30 pessoas')
  })
})
