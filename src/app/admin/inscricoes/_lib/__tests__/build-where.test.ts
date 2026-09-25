import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/edital-acesso', () => ({ getEditaisVisiveis: vi.fn().mockResolvedValue(null) }))

import { ABA_COM_RECURSO, buildInscricoesWhere } from '../build-where'

describe('buildInscricoesWhere — filtro de status', () => {
  it('filtra pelo status pedido', async () => {
    const where = await buildInscricoesWhere('u1', 'SUPER_ADMIN', { statusFilter: 'CONTEMPLADA', editalIdFilter: 'ed-1' })

    expect(where).toEqual({ status: 'CONTEMPLADA', editalId: 'ed-1' })
  })

  it('a aba de recurso procura quem tem recurso, não um status que já não existe', async () => {
    const where = await buildInscricoesWhere('u1', 'ADMIN', { statusFilter: ABA_COM_RECURSO, editalIdFilter: 'ed-1' })

    expect(where).toEqual({ recursos: { some: {} }, editalId: 'ed-1' })
    expect(where).not.toHaveProperty('status')
  })

  it('o habilitador continua sem ver rascunho na aba de recurso', async () => {
    const where = await buildInscricoesWhere('u1', 'HABILITADOR', { statusFilter: ABA_COM_RECURSO })

    expect(where.recursos).toEqual({ some: {} })
    expect(where.status).toEqual({ not: 'RASCUNHO' })
  })

  it('o habilitador não vê rascunho nem pedindo a aba de rascunho', async () => {
    const where = await buildInscricoesWhere('u1', 'HABILITADOR', { statusFilter: 'RASCUNHO' })

    expect(where.status).toEqual({ in: [] })
  })

  it('sem status, não restringe por status nem por recurso', async () => {
    const where = await buildInscricoesWhere('u1', 'ADMIN', { editalIdFilter: 'ed-1' })

    expect(where).toEqual({ editalId: 'ed-1' })
  })
})
