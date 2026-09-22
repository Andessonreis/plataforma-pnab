import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { divulgarResultadoHabilitacao } from '../divulgacao-habilitacao.service'
import {
  contempladaComMotivoAntigo,
  emAvaliacao,
  entrada,
  inabilitada,
  mockEnqueueEmail,
  mockLogAudit,
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

describe('divulgação — e-mail de resultado', () => {
  beforeEach(prepararCenarioPadrao)
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  it('envia por padrão um e-mail por inscrição, com motivo só na inabilitada', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://portal.exemplo.gov.br/'

    const resultado = await divulgarResultadoHabilitacao(entrada)

    expect(mockEnqueueEmail).toHaveBeenCalledTimes(2)
    expect(mockEnqueueEmail).toHaveBeenNthCalledWith(1, {
      to: 'ana@exemplo.com',
      subject: 'Resultado da Habilitação — Premiação Mestres',
      template: 'habilitacao',
      data: {
        nome: 'Ana Souza',
        numero: 'PNAB-2026-0001',
        edital: 'Premiação Mestres',
        resultado: 'HABILITADA',
        motivo: null,
        url: 'https://portal.exemplo.gov.br/proponente/inscricoes',
      },
    })
    expect(mockEnqueueEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: 'bia@exemplo.com',
        data: expect.objectContaining({
          resultado: 'INABILITADA',
          motivo: 'Documentação obrigatória incompleta',
        }),
      }),
    )
    expect(resultado).toEqual({
      divulgadas: 2,
      habilitadas: 1,
      inabilitadas: 1,
      emails: { enfileirados: 2, falhas: 0 },
    })
  })

  it('divulga quem já avançou de fase e o e-mail leva sempre HABILITADA ou INABILITADA, nunca o status cru', async () => {
    tx.inscricao.updateMany.mockResolvedValue({ count: 3 })
    tx.inscricao.findMany.mockResolvedValue([emAvaliacao, contempladaComMotivoAntigo, inabilitada])

    const resultado = await divulgarResultadoHabilitacao({ ...entrada, totalEsperado: 3 })

    const enviados = mockEnqueueEmail.mock.calls.map(([email]) => email.data)
    expect(enviados.map((dados) => dados.resultado)).toEqual(['HABILITADA', 'HABILITADA', 'INABILITADA'])
    expect(enviados.map((dados) => dados.motivo)).toEqual([
      null,
      null,
      'Documentação obrigatória incompleta',
    ])
    expect(resultado).toMatchObject({ divulgadas: 3, habilitadas: 2, inabilitadas: 1 })
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ inscricoesDivulgadas: 3, habilitadas: 2, inabilitadas: 1 }),
      }),
    )
  })

  it('só enfileira os e-mails depois de a transação ser confirmada', async () => {
    await divulgarResultadoHabilitacao(entrada)

    expect(trilha.ordem).toEqual(['commit', 'email', 'email'])
  })

  it('não enfileira e-mail quando o envio é desmarcado', async () => {
    const resultado = await divulgarResultadoHabilitacao({ ...entrada, enviarEmail: false })

    expect(mockEnqueueEmail).not.toHaveBeenCalled()
    expect(resultado.emails).toEqual({ enfileirados: 0, falhas: 0 })
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ enviarEmail: false, emailsEnfileirados: 0 }),
      }),
    )
  })

  it('falha ao enfileirar um e-mail não desfaz a divulgação, é contada e os demais seguem', async () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockEnqueueEmail.mockRejectedValueOnce(new Error('fila indisponível'))

    const resultado = await divulgarResultadoHabilitacao(entrada)

    expect(resultado.emails).toEqual({ enfileirados: 1, falhas: 1 })
    expect(mockEnqueueEmail).toHaveBeenCalledTimes(2)
    expect(trilha.revertida).toBe(false)
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ emailsEnfileirados: 1, emailsComFalha: 1 }),
      }),
    )
    expect(erro).toHaveBeenCalled()
  })
})
