import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  normalize,
  matchLabel,
  extractFaseItems,
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

describe('extractFaseItems', () => {
  it('formato novo: encontra fase correspondente ao status atual', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'INSCRICOES_ABERTAS', dataHora: '2026-03-01T10:00' },
      { tipo: 'fase' as const, fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-04-01T23:59' },
    ]
    const result = extractFaseItems(cronograma, 'PUBLICADO')
    expect(result).toEqual({ fase: 'INSCRICOES_ABERTAS', dataHora: '2026-03-01T10:00' })
  })

  it('formato novo: ignora fases que não batem com status atual', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-04-01T23:59' },
    ]
    const result = extractFaseItems(cronograma, 'PUBLICADO')
    expect(result).toBeNull()
  })

  it('formato legado: fallback com fuzzy matching', () => {
    const cronograma = [
      { label: 'Início das Inscrições', dataHora: '2026-03-01T10:00' },
    ]
    const result = extractFaseItems(cronograma, 'PUBLICADO')
    expect(result).toEqual({ fase: 'INSCRICOES_ABERTAS', dataHora: '2026-03-01T10:00' })
  })

  it('formato legado: encerramento de inscrições', () => {
    const cronograma = [
      { label: 'Encerramento das Inscrições', dataHora: '2026-04-01T23:59' },
    ]
    const result = extractFaseItems(cronograma, 'INSCRICOES_ABERTAS')
    expect(result).toEqual({ fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-04-01T23:59' })
  })

  it('formato novo: HABILITACAO → AVALIACAO', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'AVALIACAO', dataHora: '2026-05-01T10:00' },
    ]
    const result = extractFaseItems(cronograma, 'HABILITACAO')
    expect(result).toEqual({ fase: 'AVALIACAO', dataHora: '2026-05-01T10:00' })
  })

  it('formato novo: AVALIACAO → RESULTADO_PRELIMINAR', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'RESULTADO_PRELIMINAR', dataHora: '2026-05-15T10:00' },
    ]
    const result = extractFaseItems(cronograma, 'AVALIACAO')
    expect(result).toEqual({ fase: 'RESULTADO_PRELIMINAR', dataHora: '2026-05-15T10:00' })
  })

  it('formato novo: RESULTADO_PRELIMINAR → RECURSO', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'RECURSO', dataHora: '2026-06-01T10:00' },
    ]
    const result = extractFaseItems(cronograma, 'RESULTADO_PRELIMINAR')
    expect(result).toEqual({ fase: 'RECURSO', dataHora: '2026-06-01T10:00' })
  })

  it('formato novo: RECURSO → RESULTADO_FINAL', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'RESULTADO_FINAL', dataHora: '2026-06-15T10:00' },
    ]
    const result = extractFaseItems(cronograma, 'RECURSO')
    expect(result).toEqual({ fase: 'RESULTADO_FINAL', dataHora: '2026-06-15T10:00' })
  })

  it('formato novo: RESULTADO_FINAL → ENCERRADO', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'ENCERRADO', dataHora: '2026-07-01T10:00' },
    ]
    const result = extractFaseItems(cronograma, 'RESULTADO_FINAL')
    expect(result).toEqual({ fase: 'ENCERRADO', dataHora: '2026-07-01T10:00' })
  })

  it('item sem dataHora retorna null', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'INSCRICOES_ABERTAS', dataHora: '' },
    ]
    const result = extractFaseItems(cronograma, 'PUBLICADO')
    expect(result).toBeNull()
  })

  it('formato misto: prioriza formato novo sobre legado', () => {
    const cronograma = [
      { tipo: 'fase' as const, fase: 'INSCRICOES_ABERTAS', dataHora: '2026-03-15T10:00' },
      { label: 'Início das Inscrições', dataHora: '2026-03-01T10:00' },
    ]
    const result = extractFaseItems(cronograma, 'PUBLICADO')
    expect(result).toEqual({ fase: 'INSCRICOES_ABERTAS', dataHora: '2026-03-15T10:00' })
  })
})

describe('processSchedulerJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.edital.update.mockResolvedValue({} as never)
    mockLogAudit.mockResolvedValue(undefined)
  })

  // ── Transição 1: PUBLICADO → INSCRICOES_ABERTAS ───────────────────────

  it('PUBLICADO + data passada → INSCRICOES_ABERTAS (formato novo)', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'PUBLICADO',
        cronograma: [{ tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'INSCRICOES_ABERTAS' },
    })
  })

  it('PUBLICADO + data passada → INSCRICOES_ABERTAS (formato legado)', async () => {
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
        cronograma: [{ tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: amanha }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(0)
    expect(mockPrisma.edital.update).not.toHaveBeenCalled()
  })

  // ── Transição 2: INSCRICOES_ABERTAS → INSCRICOES_ENCERRADAS ──────────

  it('INSCRICOES_ABERTAS + encerramento passado → INSCRICOES_ENCERRADAS', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'INSCRICOES_ABERTAS',
        cronograma: [{ tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'INSCRICOES_ENCERRADAS' },
    })
  })

  // ── Transição 3: INSCRICOES_ENCERRADAS → HABILITACAO ──────────────────

  it('INSCRICOES_ENCERRADAS + data passada → HABILITACAO', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'INSCRICOES_ENCERRADAS',
        cronograma: [{ tipo: 'fase', fase: 'HABILITACAO', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'HABILITACAO' },
    })
  })

  // ── Transição 4: HABILITACAO → AVALIACAO (com check de pendências) ────

  it('HABILITACAO + data passada + sem pendências → AVALIACAO', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'HABILITACAO',
        cronograma: [{ tipo: 'fase', fase: 'AVALIACAO', dataHora: ontem }],
      },
    ] as never)
    mockPrisma.inscricao.count.mockResolvedValue(0)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'AVALIACAO' },
    })
  })

  it('HABILITACAO + data passada + inscrições ENVIADA → NÃO avança', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'HABILITACAO',
        cronograma: [{ tipo: 'fase', fase: 'AVALIACAO', dataHora: ontem }],
      },
    ] as never)
    mockPrisma.inscricao.count.mockResolvedValue(3)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(0)
    expect(mockPrisma.edital.update).not.toHaveBeenCalled()
  })

  // ── Transição 5: AVALIACAO → RESULTADO_PRELIMINAR ────────────────────

  it('AVALIACAO + data passada → RESULTADO_PRELIMINAR', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'AVALIACAO',
        cronograma: [{ tipo: 'fase', fase: 'RESULTADO_PRELIMINAR', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'RESULTADO_PRELIMINAR' },
    })
  })

  // ── Transição 6: RESULTADO_PRELIMINAR → RECURSO ──────────────────────

  it('RESULTADO_PRELIMINAR + data passada → RECURSO', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'RESULTADO_PRELIMINAR',
        cronograma: [{ tipo: 'fase', fase: 'RECURSO', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'RECURSO' },
    })
  })

  // ── Transição 7: RECURSO → RESULTADO_FINAL ──────────────────────────

  it('RECURSO + data passada → RESULTADO_FINAL', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'RECURSO',
        cronograma: [{ tipo: 'fase', fase: 'RESULTADO_FINAL', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'RESULTADO_FINAL' },
    })
  })

  // ── Transição 8: RESULTADO_FINAL → ENCERRADO ─────────────────────────

  it('RESULTADO_FINAL + data passada → ENCERRADO', async () => {
    const ontem = new Date(Date.now() - 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'RESULTADO_FINAL',
        cronograma: [{ tipo: 'fase', fase: 'ENCERRADO', dataHora: ontem }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(1)
    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'ENCERRADO' },
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────

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
        cronograma: [{ tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: ontem }],
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

  it('INSCRICOES_ABERTAS + data futura → sem mudança', async () => {
    const amanha = new Date(Date.now() + 86400000).toISOString()
    mockPrisma.edital.findMany.mockResolvedValue([
      {
        id: 'e1',
        titulo: 'Edital 1',
        status: 'INSCRICOES_ABERTAS',
        cronograma: [{ tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: amanha }],
      },
    ] as never)

    const transicoes = await processSchedulerJob()

    expect(transicoes).toBe(0)
  })
})
