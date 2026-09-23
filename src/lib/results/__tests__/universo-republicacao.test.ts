import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateResults } from '../calculate'
import { prisma } from '@/lib/db'

const mockPrisma = vi.mocked(prisma)

/**
 * Regressão: o universo de recálculo excluía os status pós-publicação, então a
 * segunda publicação (depois de julgar recursos e corrigir notas) enxergava só
 * as inscrições ainda não publicadas. Num edital já publicado isso significava
 * recalcular posição e alocação de vagas sobre um punhado de linhas — ou sobre
 * nenhuma, abortando a publicação do resultado final.
 */
describe('universo de recálculo cobre inscrições já publicadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.edital.findUnique.mockResolvedValue({
      criteriosAvaliacao: [],
      formulaAvaliacao: null,
      categoriasConfig: null,
      itensBonus: null,
    } as never)
    mockPrisma.inscricao.findMany.mockResolvedValue([] as never)
  })

  it('inclui CONTEMPLADA, SUPLENTE, NAO_CONTEMPLADA e RESULTADO_FINAL', async () => {
    await calculateResults('ed-1')

    const where = mockPrisma.inscricao.findMany.mock.calls[0][0]?.where as {
      status: { in: string[] }
    }

    expect(where.status.in).toEqual(
      expect.arrayContaining([
        'CONTEMPLADA',
        'SUPLENTE',
        'NAO_CONTEMPLADA',
        'RESULTADO_FINAL',
      ]),
    )
  })

  it('segue incluindo quem ainda não foi publicado', async () => {
    await calculateResults('ed-1')

    const where = mockPrisma.inscricao.findMany.mock.calls[0][0]?.where as {
      status: { in: string[] }
    }

    expect(where.status.in).toEqual(
      expect.arrayContaining(['HABILITADA', 'EM_AVALIACAO', 'RESULTADO_PRELIMINAR']),
    )
  })

  it('não inclui rascunho nem inscrição fora do processo de avaliação', async () => {
    await calculateResults('ed-1')

    const where = mockPrisma.inscricao.findMany.mock.calls[0][0]?.where as {
      status: { in: string[] }
    }

    expect(where.status.in).not.toContain('RASCUNHO')
    expect(where.status.in).not.toContain('ENVIADA')
    expect(where.status.in).not.toContain('INABILITADA')
  })
})
