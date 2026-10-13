import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enqueueEmail } from '@/lib/queue'

const db = {
  memorialConfig: { findUnique: vi.fn() },
  memorialAgendamento: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
  $executeRaw: vi.fn(),
  $transaction: vi.fn(),
}
vi.mock('@/lib/db', () => ({ prisma: db }))

const { decidirVisita, reagendarVisita, filtroVisitas } = await import('../memorial-agendamento-gestao.service')

const visita = {
  id: 'vis-1',
  protocolo: 'MEM-2026-ABC123',
  status: 'SOLICITADO',
  data: new Date('2026-10-15T00:00:00Z'),
  turno: 'MANHA',
  horaInicio: '09:00',
  horaFim: '09:45',
  instituicao: 'Escola',
  quantidade: 18,
  responsavelNome: 'Ana',
  responsavelEmail: 'ana@example.com',
  tipoVisitante: 'Unidade Escolar Municipal',
  motivoRecusa: null,
  resposta: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  db.memorialConfig.findUnique.mockResolvedValue(null)
  db.memorialAgendamento.findUnique.mockResolvedValue(visita)
  db.memorialAgendamento.findMany.mockResolvedValue([])
  db.memorialAgendamento.update.mockImplementation(async ({ data }) => ({ ...visita, ...data }))
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db))
})

const templates = () => vi.mocked(enqueueEmail).mock.calls.map(([j]) => j.template)

describe('decidirVisita', () => {
  it('confirmar grava quem decidiu e manda a confirmação', async () => {
    const r = await decidirVisita('vis-1', { acao: 'CONFIRMAR' }, 'adm', '1.1.1.1')
    expect(r.status).toBe('CONFIRMADO')
    expect(db.memorialAgendamento.update.mock.calls[0][0].data).toMatchObject({ decididoPorId: 'adm' })
    expect(templates()).toEqual(['memorial_visita_confirmada'])
  })

  it('recusar guarda o motivo e avisa com ele', async () => {
    await decidirVisita('vis-1', { acao: 'RECUSAR', motivo: 'Memorial fechado' }, 'adm')
    expect(db.memorialAgendamento.update.mock.calls[0][0].data.motivoRecusa).toBe('Memorial fechado')
    const job = vi.mocked(enqueueEmail).mock.calls[0][0]
    expect(job).toMatchObject({ template: 'memorial_visita_recusada', data: { situacao: 'RECUSADA', motivo: 'Memorial fechado' } })
  })

  it('cancelar visita confirmada avisa como cancelada', async () => {
    db.memorialAgendamento.findUnique.mockResolvedValue({ ...visita, status: 'CONFIRMADO' })
    await decidirVisita('vis-1', { acao: 'CANCELAR', motivo: 'Chuva forte' }, 'adm')
    expect(vi.mocked(enqueueEmail).mock.calls[0][0].data).toMatchObject({ situacao: 'CANCELADA' })
  })

  it('marcar realizada não manda e-mail', async () => {
    db.memorialAgendamento.findUnique.mockResolvedValue({ ...visita, status: 'CONFIRMADO' })
    await decidirVisita('vis-1', { acao: 'REALIZADA' }, 'adm')
    expect(enqueueEmail).not.toHaveBeenCalled()
  })

  it('ação que não cabe no status vira 409', async () => {
    await expect(decidirVisita('vis-1', { acao: 'REALIZADA' }, 'adm')).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('visita inexistente vira 404', async () => {
    db.memorialAgendamento.findUnique.mockResolvedValue(null)
    await expect(decidirVisita('x', { acao: 'CONFIRMAR' }, 'adm')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('reagendarVisita', () => {
  const novo = { data: '2026-10-16', turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '14:45' }

  it('remarca ignorando a própria visita e avisa como remarcada', async () => {
    await reagendarVisita('vis-1', novo, 'adm')
    expect(db.memorialAgendamento.findMany.mock.calls[0][0].where.id).toEqual({ not: 'vis-1' })
    expect(vi.mocked(enqueueEmail).mock.calls[0][0].data).toMatchObject({ remarcada: true })
  })

  it('não remarca por cima de outro grupo', async () => {
    db.memorialAgendamento.findMany.mockResolvedValue([
      { data: new Date('2026-10-16T00:00:00Z'), turno: 'TARDE', horaInicio: '14:00', status: 'CONFIRMADO' },
    ])
    await expect(reagendarVisita('vis-1', novo, 'adm')).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('não remarca visita encerrada', async () => {
    db.memorialAgendamento.findUnique.mockResolvedValue({ ...visita, status: 'REALIZADO' })
    await expect(reagendarVisita('vis-1', novo, 'adm')).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})

describe('filtroVisitas', () => {
  it('monta período, status e busca sem diferenciar maiúsculas', () => {
    const w = filtroVisitas({ de: '2026-10-01', ate: '2026-10-31', status: 'CONFIRMADO', busca: 'escola' })
    expect(w.status).toBe('CONFIRMADO')
    expect(w.OR).toHaveLength(4)
    expect(w.data).toEqual({ gte: new Date('2026-10-01T00:00:00Z'), lte: new Date('2026-10-31T00:00:00Z') })
  })
})
