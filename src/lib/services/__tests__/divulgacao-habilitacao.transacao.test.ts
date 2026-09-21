import { describe, it, expect, vi, beforeEach } from 'vitest'
import { divulgarResultadoHabilitacao } from '../divulgacao-habilitacao.service'
import { ServiceError } from '../errors'
import {
  entrada,
  mockEnqueueEmail,
  mockLogAudit,
  mockPrisma,
  prepararCenarioPadrao,
  trilha,
  tx,
} from './divulgacao-habilitacao.fixtures'

vi.mock('@/lib/db', () => ({
  prisma: {
    edital: { findUnique: vi.fn() },
    inscricao: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

describe('divulgação — transação e conferência do total', () => {
  beforeEach(prepararCenarioPadrao)

  it('lista com mais inscrições do que a tela confirmou → CONFLICT, transação revertida, nada avisado', async () => {
    tx.inscricao.updateMany.mockResolvedValue({ count: 3 })

    const chamada = divulgarResultadoHabilitacao(entrada)

    await expect(chamada).rejects.toBeInstanceOf(ServiceError)
    await expect(chamada).rejects.toMatchObject({
      code: 'CONFLICT',
      message:
        'A lista mudou desde que a tela foi aberta (esperado 2, agora 3). ' +
        'Atualize a tela e confira antes de divulgar.',
    })
    expect(trilha.revertida).toBe(true)
    expect(tx.inscricao.findMany).not.toHaveBeenCalled()
    expect(mockEnqueueEmail).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('lista que esvaziou depois da confirmação → CONFLICT informando o esperado e o atual', async () => {
    tx.inscricao.updateMany.mockResolvedValue({ count: 0 })

    await expect(divulgarResultadoHabilitacao(entrada)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('(esperado 2, agora 0)'),
    })
    expect(trilha.revertida).toBe(true)
    expect(mockEnqueueEmail).not.toHaveBeenCalled()
  })

  it('sem inscrição decidida aguardando → CONFLICT, sem e-mail nem auditoria', async () => {
    tx.inscricao.updateMany.mockResolvedValue({ count: 0 })

    const chamada = divulgarResultadoHabilitacao({ ...entrada, totalEsperado: 0 })

    await expect(chamada).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Não há inscrição decidida aguardando divulgação.',
    })
    expect(trilha.revertida).toBe(true)
    expect(tx.inscricao.findMany).not.toHaveBeenCalled()
    expect(mockEnqueueEmail).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('edital inexistente → NOT_FOUND, sem abrir transação', async () => {
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    await expect(divulgarResultadoHabilitacao(entrada)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    expect(tx.inscricao.updateMany).not.toHaveBeenCalled()
  })

  it('audita a divulgação com contagens e números, sem dado pessoal', async () => {
    await divulgarResultadoHabilitacao(entrada)

    expect(mockLogAudit).toHaveBeenCalledTimes(1)
    const registro = mockLogAudit.mock.calls[0][0]
    expect(registro).toMatchObject({
      userId: 'u1',
      action: 'RESULTADO_HABILITACAO_DIVULGADO',
      entity: 'Edital',
      entityId: 'ed-1',
      ip: '203.0.113.7',
      details: {
        editalTitulo: 'Premiação Mestres',
        inscricoesDivulgadas: 2,
        habilitadas: 1,
        inabilitadas: 1,
        numeros: ['PNAB-2026-0001', 'PNAB-2026-0002'],
        enviarEmail: true,
        emailsEnfileirados: 2,
        emailsComFalha: 0,
      },
    })
    expect(JSON.stringify(registro.details)).not.toMatch(/exemplo\.com|Ana|Bia|Documentação/)
  })
})
