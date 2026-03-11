import { describe, it, expect, vi, beforeEach } from 'vitest'

// Importa apenas as funções puras e processSchedulerJob (não o Worker)
import {
  normalize,
  matchLabel,
  INICIO_INSCRICOES_PATTERNS,
  ENCERRAMENTO_INSCRICOES_PATTERNS,
  processSchedulerJob,
} from '../scheduler.worker'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

describe('normalize', () => {
  it('remove acentos', () => {
    expect(normalize('Início das Inscrições')).toBe('inicio das inscricoes')
  })

  it('converte maiúsculas', () => {
    expect(normalize('ABERTURA INSCRICOES')).toBe('abertura inscricoes')
  })

  it('colapsa espaços múltiplos', () => {
    expect(normalize('fim   das    inscricoes')).toBe('fim das inscricoes')
  })
})

describe('matchLabel', () => {
  it('match exato', () => {
    expect(matchLabel('inicio das inscricoes', INICIO_INSCRICOES_PATTERNS)).toBe(true)
  })

  it('match com acentos', () => {
    expect(matchLabel('Início das Inscrições', INICIO_INSCRICOES_PATTERNS)).toBe(true)
  })

  it('sem match retorna false', () => {
    expect(matchLabel('Resultado final', INICIO_INSCRICOES_PATTERNS)).toBe(false)
  })

  it('label com espaços extras', () => {
    expect(matchLabel('  Encerramento  das  Inscrições  ', ENCERRAMENTO_INSCRICOES_PATTERNS)).toBe(true)
  })
})

describe('processSchedulerJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.edital.update.mockResolvedValue({} as never)
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('PUBLICADO + data passada → INSCRICOES_ABERTAS', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'PUBLICADO',
        cronograma: [{ label: 'Início das Inscrições', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'INSCRICOES_ABERTAS' },
    })
  })

  it('PUBLICADO + data futura → sem mudança', async () => {
    const amanha = new Date(Date.now() + 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'PUBLICADO',
        cronograma: [{ label: 'Início das Inscrições', dataHora: amanha }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(0)
    expect(mockPrisma.edital.update).not.toHaveBeenCalled()
  })

  it('INSCRICOES_ABERTAS + encerramento passado → INSCRICOES_ENCERRADAS', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'INSCRICOES_ABERTAS',
        cronograma: [{ label: 'Encerramento das Inscrições', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'INSCRICOES_ENCERRADAS' },
    })
  })

  it('INSCRICOES_ABERTAS + data futura → sem mudança', async () => {
    const amanha = new Date(Date.now() + 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'INSCRICOES_ABERTAS',
        cronograma: [{ label: 'Encerramento das Inscrições', dataHora: amanha }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(0)
  })

  it('cronograma vazio → sem mudança', async () => {
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'PUBLICADO',
        cronograma: [],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(0)
  })

  it('sem edital elegível → 0 transições', async () => {
    mockPrisma.edital.findMany.mockResolvedValue([])

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(0)
  })

  it('registra audit log com dados corretos', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital Teste',
        status: 'PUBLICADO',
        cronograma: [{ label: 'Início das Inscrições', dataHora: ontem }],
      },
    ] as never)

    await processSchedulerJob()

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'STATUS_ALTERADO',
      entity: 'Edital',
      entityId: 'e1',
      details: {
        titulo: 'Edital Teste',
        statusAnterior: 'PUBLICADO',
        novoStatus: 'INSCRICOES_ABERTAS',
        automatico: true,
      },
    })
  })
})
