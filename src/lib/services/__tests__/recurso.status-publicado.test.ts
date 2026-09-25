import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consolidarRecurso, decideRecurso } from '../recurso.service'
import { prisma } from '@/lib/db'

const mockPrisma = vi.mocked(prisma)

/** Três avaliadores no colegiado, todos votando na mesma direção: fecha o consenso. */
function arrangeConsenso(fase: string, decisao: 'DEFERIDO' | 'INDEFERIDO') {
  mockPrisma.recurso.findUnique.mockResolvedValue({
    inscricaoId: 'insc-1',
    fase,
    decisao: null,
    respostas: ['A', 'B', 'C'].map((p) => ({ decisao, justificativa: `parecer ${p}` })),
  } as never)
  mockPrisma.avaliacao.count.mockResolvedValue(3 as never)
}

describe('decisão de recurso do resultado não altera o status da inscrição', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['RESULTADO_PRELIMINAR', 'DEFERIDO'],
    ['RESULTADO_PRELIMINAR', 'INDEFERIDO'],
    ['RESULTADO_FINAL', 'DEFERIDO'],
    ['RESULTADO_FINAL', 'INDEFERIDO'],
  ] as const)('consenso em %s (%s) grava a decisão e preserva a classificação publicada', async (fase, decisao) => {
    arrangeConsenso(fase, decisao)

    const estado = await consolidarRecurso('rec-1')

    expect(estado).toBe('CONSOLIDADO')
    expect(mockPrisma.recurso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ decisao, decididoPor: 'CONSENSO' }),
      }),
    )
    expect(mockPrisma.inscricao.update).not.toHaveBeenCalled()
  })

  it.each(['RESULTADO_PRELIMINAR', 'RESULTADO_FINAL'])(
    'desempate do admin em %s também preserva a classificação publicada',
    async (fase) => {
      mockPrisma.recurso.findUnique.mockResolvedValue({ inscricaoId: 'insc-1', fase, decisao: null } as never)

      await decideRecurso('insc-1', 'rec-1', { decisao: 'INDEFERIDO', justificativa: 'Sem fundamento.' }, 'admin-1')

      expect(mockPrisma.recurso.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ decisao: 'INDEFERIDO', decididoPor: 'ADMIN' }) }),
      )
      expect(mockPrisma.inscricao.update).not.toHaveBeenCalled()
    },
  )

  it('recurso da habilitação segue movendo o status: deferido habilita, indeferido inabilita', async () => {
    arrangeConsenso('HABILITACAO', 'INDEFERIDO')
    await consolidarRecurso('rec-1')
    expect(mockPrisma.inscricao.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { status: 'INABILITADA' } }),
    )

    arrangeConsenso('HABILITACAO', 'DEFERIDO')
    await consolidarRecurso('rec-1')
    expect(mockPrisma.inscricao.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { status: 'HABILITADA' } }),
    )
  })
})
