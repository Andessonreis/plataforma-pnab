import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'
import { enqueueEmail } from '@/lib/queue'
import { logAudit } from '@/lib/audit'

const db = {
  memorialConfig: { findUnique: vi.fn() },
  memorialRegulamento: { findFirst: vi.fn() },
  memorialAgendamento: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), count: vi.fn() },
  questionario: { findFirst: vi.fn() },
  user: { findMany: vi.fn() },
  $executeRaw: vi.fn(),
  $transaction: vi.fn(),
}
vi.mock('@/lib/db', () => ({ prisma: db }))

const registrarResposta = vi.fn()
vi.mock('@/lib/services/questionario-resposta.service', () => ({
  registrarRespostaQuestionario: (...a: unknown[]) => registrarResposta(...a),
}))

const { solicitarVisita, consultarDisponibilidade } = await import('../memorial-agendamento.service')

// Segunda-feira, 12/10/2026, 10h em Irecê
const AGORA = new Date('2026-10-12T13:00:00.000Z')

const entrada = {
  data: '2026-10-15',
  turno: 'MANHA' as const,
  horaInicio: '09:00',
  horaFim: '09:45',
  tipoVisitante: 'Unidade Escolar Municipal' as const,
  instituicao: 'Escola Rui Barbosa',
  quantidade: 18,
  faixaEtaria: 'Fundamental I (6 a 10 anos)',
  preferenciaContato: 'E-mail' as const,
  responsavelNome: 'Ana Souza',
  responsavelEmail: 'ana@example.com',
  responsavelTelefone: '74999990000',
  regulamentoVersao: 3,
  aceite: true as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  db.memorialConfig.findUnique.mockResolvedValue(null)
  db.memorialRegulamento.findFirst.mockResolvedValue({ versao: 3, texto: 'Regras', vigenteDesde: new Date() })
  db.questionario.findFirst.mockResolvedValue(null)
  db.memorialAgendamento.findUnique.mockResolvedValue(null)
  db.memorialAgendamento.findMany.mockResolvedValue([])
  db.memorialAgendamento.create.mockImplementation(async ({ data }) => ({ id: 'vis-1', status: 'SOLICITADO', ...data }))
  db.user.findMany.mockResolvedValue([{ nome: 'Comunicação', email: 'com@irece.ba.gov.br' }])
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db))
})

describe('solicitarVisita', () => {
  it('grava o pedido com protocolo MEM, versão do regulamento e aceite', async () => {
    const r = await solicitarVisita(entrada, { userId: 'u1' }, AGORA)
    expect(r.protocolo).toMatch(/^MEM-\d{4}-[A-Z0-9]{6}$/)
    expect(r.mensagem).toContain('NÃO está confirmada')
    const { data } = db.memorialAgendamento.create.mock.calls[0][0]
    expect(data).toMatchObject({ regulamentoVersao: 3, aceiteEm: AGORA, userId: 'u1', respostaId: null })
    expect(data.data.toISOString()).toBe('2026-10-15T00:00:00.000Z')
  })

  it('trava o dia antes de conferir as vagas', async () => {
    await solicitarVisita(entrada, {}, AGORA)
    expect(db.$executeRaw).toHaveBeenCalledTimes(1)
    expect(db.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(db.memorialAgendamento.findMany.mock.invocationCallOrder[0])
  })

  it('horário tomado dentro da transação vira 409', async () => {
    db.memorialAgendamento.findMany.mockResolvedValue([
      { data: new Date('2026-10-15T00:00:00Z'), turno: 'MANHA', horaInicio: '09:00', status: 'SOLICITADO' },
    ])
    await expect(solicitarVisita(entrada, {}, AGORA)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(db.memorialAgendamento.create).not.toHaveBeenCalled()
  })

  it('regra violada vira 400 com a mensagem da configuração', async () => {
    await expect(solicitarVisita({ ...entrada, quantidade: 25 }, {}, AGORA)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('20 pessoas'),
    })
  })

  it('aceite de versão antiga do regulamento é recusado', async () => {
    await expect(solicitarVisita({ ...entrada, regulamentoVersao: 2 }, {}, AGORA)).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('sem regulamento publicado o agendamento fica fechado', async () => {
    db.memorialRegulamento.findFirst.mockResolvedValue(null)
    await expect(solicitarVisita(entrada, {}, AGORA)).rejects.toMatchObject({ code: 'LOCKED' })
  })

  it('com questionário publicado, grava as perguntas extras na mesma transação', async () => {
    db.questionario.findFirst.mockResolvedValue({ id: 'q1', slug: 'agendamento', titulo: 'Extras', descricao: null, campos: [] })
    registrarResposta.mockResolvedValue({ id: 'resp-1' })
    await solicitarVisita({ ...entrada, perguntasExtras: { escola: 'sim' } }, {}, AGORA)
    expect(registrarResposta).toHaveBeenCalledWith('q1', { escola: 'sim' }, expect.objectContaining({ tx: db }))
    expect(db.memorialAgendamento.create.mock.calls[0][0].data.respostaId).toBe('resp-1')
  })

  it('avisa o responsável e a equipe (Comunicação + contato do Memorial)', async () => {
    await solicitarVisita(entrada, {}, AGORA)
    const enviados = vi.mocked(enqueueEmail).mock.calls.map(([j]) => [j.template, j.to])
    expect(enviados).toContainEqual(['memorial_solicitacao_recebida', 'ana@example.com'])
    expect(enviados).toContainEqual(['memorial_nova_solicitacao', 'com@irece.ba.gov.br'])
    expect(enviados).toContainEqual(['memorial_nova_solicitacao', 'memorialirececsj@gmail.com'])
  })

  it('com a cópia na fila, a resposta autoriza a tela a prometer o e-mail', async () => {
    await expect(solicitarVisita(entrada, {}, AGORA)).resolves.toMatchObject({ copiaEnviada: true })
    const recibo = vi.mocked(enqueueEmail).mock.calls.find(([j]) => j.template === 'memorial_solicitacao_recebida')![0]
    expect(recibo.data).toMatchObject({
      protocolo: expect.stringMatching(/^MEM-/),
      data: 'quinta-feira, 15 de outubro de 2026',
      horario: '09:00 às 09:45',
      aviso: expect.stringContaining('NÃO está confirmada'),
      contatoUrl: expect.stringContaining('/contato?assunto=memorial-visita&protocolo=MEM-'),
    })
  })

  it('violação do índice único de horário vira o mesmo 409 de horário ocupado', async () => {
    db.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['data', 'horaInicio'] },
      }),
    )
    await expect(solicitarVisita(entrada, {}, AGORA)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('acabou de ser ocupado'),
    })
  })

  it('falha na fila de e-mail não derruba o pedido', async () => {
    vi.mocked(enqueueEmail).mockRejectedValue(new Error('redis fora'))
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(solicitarVisita(entrada, {}, AGORA)).resolves.toMatchObject({ copiaEnviada: false })
    expect(JSON.stringify(erro.mock.calls)).not.toContain('ana@example.com')
    erro.mockRestore()
    vi.mocked(enqueueEmail).mockResolvedValue(undefined as never)
  })

  it('auditoria não leva nome nem e-mail', async () => {
    await solicitarVisita(entrada, {}, AGORA)
    const detalhes = JSON.stringify(vi.mocked(logAudit).mock.calls[0][0])
    expect(detalhes).not.toContain('Ana Souza')
    expect(detalhes).not.toContain('ana@example.com')
  })
})

describe('consultarDisponibilidade', () => {
  it('devolve os dias de visitação a partir de hoje com a grade inteira e o motivo de cada horário', async () => {
    const r = await consultarDisponibilidade({ de: '2026-10-10', ate: '2026-10-18' }, AGORA)
    // 10/11 e 17/18 são fim de semana; 12 e 13 ficam inteiros dentro das 48h
    expect(r.dias.map((d) => d.data)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'])
    expect(r.dias[0].horarios.every((h) => h.motivo === 'ANTECEDENCIA')).toBe(true)
    const dia14 = r.dias[2].horarios
    expect(dia14.filter((h) => h.motivo === 'ANTECEDENCIA').map((h) => h.inicio)).toEqual(['09:00', '09:45'])
    expect(dia14.find((h) => h.inicio === '10:30')?.motivo).toBeNull()
  })

  it('nada sobre quem reservou sai na disponibilidade', async () => {
    db.memorialAgendamento.findMany.mockResolvedValue([
      { data: new Date('2026-10-15T00:00:00Z'), turno: 'MANHA', horaInicio: '09:00', status: 'SOLICITADO' },
    ])
    const r = await consultarDisponibilidade({ de: '2026-10-15', ate: '2026-10-15' }, AGORA)
    expect(Object.keys(r.dias[0].horarios[0]).sort()).toEqual(['fim', 'inicio', 'motivo', 'turno'])
    expect(r.dias[0].horarios[0].motivo).toBe('RESERVADO')
  })

  it('intervalo todo no passado devolve vazio sem consultar o banco', async () => {
    const r = await consultarDisponibilidade({ mes: '2026-09' }, AGORA)
    expect(r.dias).toEqual([])
    expect(db.memorialAgendamento.findMany).not.toHaveBeenCalled()
  })
})
