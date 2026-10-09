import { describe, it, expect, vi, beforeEach } from 'vitest'

const db = { memorialAgendamento: { findMany: vi.fn(), count: vi.fn() } }
vi.mock('@/lib/db', () => ({ prisma: db }))

const { filtroDaAba, ordemDaAba, contarAbas } = await import('../memorial-agenda-abas.service')

beforeEach(() => vi.clearAllMocks())

describe('filtroDaAba', () => {
  it('"Para responder" junta os pedidos em aberto e ignora a situação da URL', () => {
    const w = filtroDaAba('responder', { status: 'RECUSADO', busca: 'escola' }, '2026-10-09')
    expect(w.status).toEqual({ in: ['SOLICITADO', 'EM_ANALISE', 'REAGENDAMENTO_SOLICITADO'] })
    expect(w.OR).toHaveLength(4)
  })

  it('"Confirmadas" olha de hoje em diante quando não há data escolhida', () => {
    const w = filtroDaAba('confirmadas', {}, '2026-10-09')
    expect(w.status).toEqual({ in: ['CONFIRMADO'] })
    expect(w.data).toEqual({ gte: new Date('2026-10-09T00:00:00Z') })
  })

  it('"Confirmadas" respeita o período escolhido', () => {
    const w = filtroDaAba('confirmadas', { de: '2026-09-01', ate: '2026-09-30' }, '2026-10-09')
    expect(w.data).toEqual({ gte: new Date('2026-09-01T00:00:00Z'), lte: new Date('2026-09-30T00:00:00Z') })
  })

  it('"Todas" usa a situação escolhida no filtro', () => {
    expect(filtroDaAba('todas', { status: 'RECUSADO' }, '2026-10-09').status).toBe('RECUSADO')
  })
})

describe('ordemDaAba', () => {
  it('pedidos por ordem de chegada; realizadas da mais recente', () => {
    expect(ordemDaAba('responder')).toEqual([{ createdAt: 'asc' }])
    expect(ordemDaAba('realizadas')[0]).toEqual({ data: 'desc' })
    expect(ordemDaAba('confirmadas')[0]).toEqual({ data: 'asc' })
  })
})

describe('contarAbas', () => {
  it('conta cada aba com a regra dela', async () => {
    db.memorialAgendamento.count.mockResolvedValueOnce(4).mockResolvedValueOnce(3).mockResolvedValueOnce(1).mockResolvedValueOnce(9)
    expect(await contarAbas(new Date('2026-10-09T12:00:00Z'))).toEqual({ responder: 4, confirmadas: 3, realizadas: 1, todas: 9 })
    expect(db.memorialAgendamento.count).toHaveBeenCalledTimes(4)
  })
})
