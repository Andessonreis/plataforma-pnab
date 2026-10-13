import { describe, it, expect } from 'vitest'
import {
  dateParaDia,
  diaDaSemana,
  diaEmIrece,
  diaParaDate,
  diasEntre,
  ehDiaValido,
  ehMesValido,
  formatarDiaCurto,
  formatarDiaPorExtenso,
  inicioDaVisita,
  intervaloDoMes,
} from '../datas'
import { acoesPossiveis, statusAposAcao } from '../status'
import { montarRelatorio, type LinhaRelatorio } from '../relatorio'

describe('datas', () => {
  it('valida dia e mês de verdade', () => {
    expect(ehDiaValido('2026-02-28')).toBe(true)
    expect(ehDiaValido('2026-02-30')).toBe(false)
    expect(ehDiaValido('15/10/2026')).toBe(false)
    expect(ehMesValido('2026-12')).toBe(true)
    expect(ehMesValido('2026-13')).toBe(false)
  })
  it('ida e volta com @db.Date não muda o dia', () => {
    expect(dateParaDia(diaParaDate('2026-10-15'))).toBe('2026-10-15')
  })
  it('início da visita é no horário de Irecê (UTC-3)', () => {
    expect(inicioDaVisita('2026-10-15', '09:00').toISOString()).toBe('2026-10-15T12:00:00.000Z')
  })
  it('dia em Irecê vira só às 3h UTC', () => {
    expect(diaEmIrece(new Date('2026-10-16T02:59:00.000Z'))).toBe('2026-10-15')
    expect(diaEmIrece(new Date('2026-10-16T03:00:00.000Z'))).toBe('2026-10-16')
  })
  it('dia da semana', () => {
    expect(diaDaSemana('2026-10-15')).toBe(4)
    expect(diaDaSemana('2026-10-18')).toBe(0)
  })
  it('intervalo do mês respeita fevereiro e virada de ano', () => {
    expect(intervaloDoMes('2028-02')).toEqual({ de: '2028-02-01', ate: '2028-02-29' })
    expect(intervaloDoMes('2026-12')).toEqual({ de: '2026-12-01', ate: '2026-12-31' })
  })
  it('lista dias do intervalo inclusive', () => {
    expect(diasEntre('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'])
  })
  it('formata em pt-BR sem deslocar o dia', () => {
    expect(formatarDiaCurto('2026-10-01')).toBe('01/10/2026')
    expect(formatarDiaPorExtenso('2026-10-01')).toBe('quinta-feira, 1 de outubro de 2026')
  })
})

describe('transições de status', () => {
  it('confirma ou recusa só o que está em aberto', () => {
    expect(statusAposAcao('SOLICITADO', 'CONFIRMAR')).toBe('CONFIRMADO')
    expect(statusAposAcao('EM_ANALISE', 'RECUSAR')).toBe('RECUSADO')
    expect(statusAposAcao('CONFIRMADO', 'CONFIRMAR')).toBeNull()
    expect(statusAposAcao('RECUSADO', 'CONFIRMAR')).toBeNull()
  })
  it('realizada e falta só depois de confirmada', () => {
    expect(statusAposAcao('CONFIRMADO', 'REALIZADA')).toBe('REALIZADO')
    expect(statusAposAcao('CONFIRMADO', 'NAO_COMPARECEU')).toBe('NAO_COMPARECEU')
    expect(statusAposAcao('SOLICITADO', 'REALIZADA')).toBeNull()
  })
  it('cancelar vale para confirmada, não para encerrada', () => {
    expect(statusAposAcao('CONFIRMADO', 'CANCELAR')).toBe('CANCELADO')
    expect(statusAposAcao('REALIZADO', 'CANCELAR')).toBeNull()
  })
  it('status encerrados não têm ação', () => {
    for (const s of ['RECUSADO', 'CANCELADO', 'REALIZADO', 'NAO_COMPARECEU'] as const) expect(acoesPossiveis(s)).toEqual([])
  })
})

describe('montarRelatorio', () => {
  const linha = (extra: Partial<LinhaRelatorio>): LinhaRelatorio => ({
    status: 'CONFIRMADO',
    tipoVisitante: 'Unidade Escolar Municipal',
    faixaEtaria: '6 a 10 anos',
    quantidade: 20,
    turno: 'MANHA',
    horaInicio: '09:00',
    ...extra,
  })

  it('soma visitas, visitantes, cancelamentos e comparecimento', () => {
    const r = montarRelatorio([
      linha({}),
      linha({ status: 'REALIZADO', quantidade: 10 }),
      linha({ status: 'REALIZADO', quantidade: 5, tipoVisitante: 'Grupo de Turistas', faixaEtaria: null }),
      linha({ status: 'NAO_COMPARECEU' }),
      linha({ status: 'CANCELADO' }),
      linha({ status: 'RECUSADO' }),
      linha({ status: 'SOLICITADO' }),
    ])
    expect(r.pedidos).toBe(7)
    expect(r.visitas).toBe(3)
    expect(r.visitantes).toBe(35)
    expect(r.realizadas).toBe(2)
    expect(r.visitantesRealizados).toBe(15)
    expect(r.cancelamentos).toBe(1)
    expect(r.recusas).toBe(1)
    expect(r.taxaComparecimento).toBeCloseTo(2 / 3)
    expect(r.porTipoVisitante[0]).toEqual({ chave: 'Unidade Escolar Municipal', visitas: 2, visitantes: 30 })
    expect(r.porFaixaEtaria.find((g) => g.chave === 'Não informada')?.visitas).toBe(1)
  })

  it('sem visita encerrada a taxa fica nula', () => {
    expect(montarRelatorio([linha({})]).taxaComparecimento).toBeNull()
    expect(montarRelatorio([]).pedidos).toBe(0)
  })
})
