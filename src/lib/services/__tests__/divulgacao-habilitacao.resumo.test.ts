import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getResumoDivulgacao } from '../divulgacao-habilitacao.service'
import {
  STATUS_DIVULGAVEIS,
  filtrosDe,
  listaDeStatus,
  mockPrisma,
  prepararCenarioPadrao,
  type Filtro,
} from './divulgacao-habilitacao.fixtures'

vi.mock('@/lib/db', () => ({
  prisma: {
    edital: { findUnique: vi.fn() },
    inscricao: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

describe('getResumoDivulgacao', () => {
  beforeEach(prepararCenarioPadrao)

  it('separa o que aguarda divulgação, o já divulgado e o que segue em conferência', async () => {
    mockPrisma.inscricao.count.mockImplementation((async ({ where }: { where: Filtro }) => {
      if (where.resultadoLiberadoEm === null) return where.status === 'INABILITADA' ? 2 : 8
      if (where.resultadoLiberadoEm) return 5
      return where.status === 'ENVIADA' ? 3 : 0
    }) as never)

    const resumo = await getResumoDivulgacao('ed-1')

    expect(resumo).toEqual({
      aDivulgar: { habilitadas: 8, inabilitadas: 2, total: 10 },
      jaDivulgadas: 5,
      emConferencia: 3,
    })
    expect(mockPrisma.inscricao.count).toHaveBeenCalledWith({ where: { editalId: 'ed-1', status: 'ENVIADA' } })
  })

  it('conta como habilitadas as pendentes que já avançaram de fase, como em avaliação', async () => {
    mockPrisma.inscricao.count.mockResolvedValue(0 as never)

    await getResumoDivulgacao('ed-1')

    const [habilitadas] = filtrosDe(mockPrisma.inscricao.count)
    expect(habilitadas.resultadoLiberadoEm).toBeNull()
    expect(listaDeStatus(habilitadas)).toEqual(STATUS_DIVULGAVEIS.filter((status) => status !== 'INABILITADA'))
    expect(listaDeStatus(habilitadas)).toEqual(expect.arrayContaining(['HABILITADA', 'EM_AVALIACAO', 'CONTEMPLADA']))
  })

  it('nunca conta RECURSO_ABERTO como pendente, nem entre as habilitadas nem entre as inabilitadas', async () => {
    mockPrisma.inscricao.count.mockResolvedValue(0 as never)

    await getResumoDivulgacao('ed-1')

    const [habilitadas, inabilitadas] = filtrosDe(mockPrisma.inscricao.count)
    expect(listaDeStatus(habilitadas)).not.toContain('RECURSO_ABERTO')
    expect(inabilitadas.status).toBe('INABILITADA')
  })

  it('conta as já divulgadas sem filtrar por status, pois elas seguem para outras fases', async () => {
    mockPrisma.inscricao.count.mockResolvedValue(0 as never)

    await getResumoDivulgacao('ed-1')

    expect(mockPrisma.inscricao.count).toHaveBeenCalledWith({
      where: { editalId: 'ed-1', resultadoLiberadoEm: { not: null } },
    })
  })
})
