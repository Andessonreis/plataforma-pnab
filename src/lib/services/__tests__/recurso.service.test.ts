import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consolidarRecurso, responderRecurso, listRecursos } from '../recurso.service'
import { ServiceError } from '../errors'
import { prisma } from '@/lib/db'

const mockPrisma = vi.mocked(prisma)

describe('consolidarRecurso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('faltam respostas → PENDENTE, sem gravar decisão', async () => {
    mockPrisma.recurso.findUnique.mockResolvedValue({
      inscricaoId: 'insc-1',
      fase: 'HABILITACAO',
      decisao: null,
      respostas: [{ decisao: 'DEFERIDO', justificativa: 'ok' }],
    } as never)
    mockPrisma.avaliacao.count.mockResolvedValue(2 as never)

    const estado = await consolidarRecurso('rec-1')

    expect(estado).toBe('PENDENTE')
    expect(mockPrisma.recurso.update).not.toHaveBeenCalled()
    expect(mockPrisma.inscricao.update).not.toHaveBeenCalled()
  })

  it('todos deferem → CONSOLIDADO, status HABILITADA na fase de habilitação', async () => {
    mockPrisma.recurso.findUnique.mockResolvedValue({
      inscricaoId: 'insc-1',
      fase: 'HABILITACAO',
      decisao: null,
      respostas: [
        { decisao: 'DEFERIDO', justificativa: 'parecer A' },
        { decisao: 'DEFERIDO', justificativa: 'parecer B' },
      ],
    } as never)
    mockPrisma.avaliacao.count.mockResolvedValue(2 as never)

    const estado = await consolidarRecurso('rec-1')

    expect(estado).toBe('CONSOLIDADO')
    expect(mockPrisma.recurso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ decisao: 'DEFERIDO', decididoPor: 'CONSENSO' }),
      }),
    )
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'HABILITADA' } }),
    )
  })

  it('avaliadores divergem → DIVERGENTE, sem gravar decisão', async () => {
    mockPrisma.recurso.findUnique.mockResolvedValue({
      inscricaoId: 'insc-1',
      fase: 'RESULTADO_PRELIMINAR',
      decisao: null,
      respostas: [
        { decisao: 'DEFERIDO', justificativa: 'parecer A' },
        { decisao: 'INDEFERIDO', justificativa: 'parecer B' },
      ],
    } as never)
    mockPrisma.avaliacao.count.mockResolvedValue(2 as never)

    const estado = await consolidarRecurso('rec-1')

    expect(estado).toBe('DIVERGENTE')
    expect(mockPrisma.recurso.update).not.toHaveBeenCalled()
    expect(mockPrisma.inscricao.update).not.toHaveBeenCalled()
  })

  it('recurso já decidido → CONSOLIDADO sem regravar', async () => {
    mockPrisma.recurso.findUnique.mockResolvedValue({
      inscricaoId: 'insc-1',
      fase: 'HABILITACAO',
      decisao: 'DEFERIDO',
      respostas: [],
    } as never)

    const estado = await consolidarRecurso('rec-1')

    expect(estado).toBe('CONSOLIDADO')
    expect(mockPrisma.recurso.update).not.toHaveBeenCalled()
  })
})

describe('responderRecurso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('quem não é avaliador da inscrição → FORBIDDEN', async () => {
    mockPrisma.recurso.findUnique.mockResolvedValue({
      inscricaoId: 'insc-1',
      fase: 'HABILITACAO',
      decisao: null,
    } as never)
    mockPrisma.avaliacao.findUnique.mockResolvedValue(null as never)

    await expect(
      responderRecurso('insc-1', 'rec-1', { decisao: 'DEFERIDO', justificativa: 'parecer suficiente' }, 'u-estranho'),
    ).rejects.toThrowError(ServiceError)
    expect(mockPrisma.recursoResposta.upsert).not.toHaveBeenCalled()
  })

  it('recurso já decidido → CONFLICT', async () => {
    mockPrisma.recurso.findUnique.mockResolvedValue({
      inscricaoId: 'insc-1',
      fase: 'HABILITACAO',
      decisao: 'INDEFERIDO',
    } as never)

    await expect(
      responderRecurso('insc-1', 'rec-1', { decisao: 'DEFERIDO', justificativa: 'parecer suficiente' }, 'u-aval'),
    ).rejects.toThrowError(ServiceError)
  })
})

describe('listRecursos — gate por fase para o proponente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('proponente: decisão escondida antes do fim da fase', async () => {
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      proponenteId: 'u1',
      edital: { status: 'RECURSO' },
    } as never)
    mockPrisma.recurso.findMany.mockResolvedValue([
      { id: 'r1', fase: 'RESULTADO_PRELIMINAR', decisao: 'DEFERIDO', justificativa: 'x', decididoPor: 'CONSENSO' },
    ] as never)

    const recursos = await listRecursos('insc-1', 'u1', 'PROPONENTE')

    expect(recursos[0].decisao).toBeNull()
    expect(recursos[0].justificativa).toBeNull()
  })

  it('proponente: decisão visível após o fim da fase', async () => {
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      proponenteId: 'u1',
      edital: { status: 'RESULTADO_FINAL' },
    } as never)
    mockPrisma.recurso.findMany.mockResolvedValue([
      { id: 'r1', fase: 'RESULTADO_PRELIMINAR', decisao: 'DEFERIDO', justificativa: 'x', decididoPor: 'CONSENSO' },
    ] as never)

    const recursos = await listRecursos('insc-1', 'u1', 'PROPONENTE')

    expect(recursos[0].decisao).toBe('DEFERIDO')
    expect(recursos[0].justificativa).toBe('x')
  })

  it('staff vê a decisão independente da fase', async () => {
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      proponenteId: 'u1',
      edital: { status: 'RECURSO' },
    } as never)
    mockPrisma.recurso.findMany.mockResolvedValue([
      { id: 'r1', fase: 'RESULTADO_PRELIMINAR', decisao: 'DEFERIDO', justificativa: 'x', decididoPor: 'ADMIN' },
    ] as never)

    const recursos = await listRecursos('insc-1', 'admin-1', 'ADMIN')

    expect(recursos[0].decisao).toBe('DEFERIDO')
  })
})
