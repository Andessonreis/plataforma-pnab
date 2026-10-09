import { describe, it, expect, vi, beforeEach } from 'vitest'

const db = {
  memorialAgendamento: { findMany: vi.fn(), count: vi.fn() },
}
vi.mock('@/lib/db', () => ({ prisma: db }))

const { montarSemana, pedidosParaResponder, proximosSeteDias } = await import('../memorial-painel-visao.service')

const v = (id: string, dia: string, status: string) => ({ id, data: new Date(`${dia}T00:00:00Z`), status }) as never

beforeEach(() => vi.clearAllMocks())

describe('montarSemana', () => {
  it('mantém os dias vazios e deixa de fora recusadas e canceladas', () => {
    const dias = ['2026-10-09', '2026-10-10', '2026-10-11']
    const semana = montarSemana(dias, [v('a', '2026-10-09', 'CONFIRMADO'), v('b', '2026-10-09', 'RECUSADO'), v('c', '2026-10-11', 'EM_ANALISE')])
    expect(semana.map((d) => d.visitas.map((x: { id: string }) => x.id))).toEqual([['a'], [], ['c']])
  })
})

describe('pedidosParaResponder', () => {
  it('busca os pedidos em aberto do mais antigo ao mais novo', async () => {
    db.memorialAgendamento.findMany.mockResolvedValue([])
    db.memorialAgendamento.count.mockResolvedValue(4)
    const r = await pedidosParaResponder(3)
    const args = db.memorialAgendamento.findMany.mock.calls[0][0]
    expect(args.orderBy).toEqual({ createdAt: 'asc' })
    expect(args.take).toBe(3)
    expect(args.where.status.in).toEqual(['SOLICITADO', 'EM_ANALISE', 'REAGENDAMENTO_SOLICITADO'])
    expect(r.total).toBe(4)
  })
})

describe('proximosSeteDias', () => {
  it('começa hoje em Irecê e cobre sete dias', async () => {
    db.memorialAgendamento.findMany.mockResolvedValue([])
    const r = await proximosSeteDias(new Date('2026-10-09T02:00:00Z'))
    expect(r.hoje).toBe('2026-10-08')
    expect(r.dias.map((d) => d.dia)).toEqual([
      '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14',
    ])
  })
})
