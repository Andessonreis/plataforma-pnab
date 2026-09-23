import { describe, it, expect, vi, beforeEach } from 'vitest'
import { decideRecurso, submitRecurso } from '../recurso.service'
import { ServiceError } from '../errors'
import { prisma } from '@/lib/db'
import { enqueueEmail } from '@/lib/queue'

const mockPrisma = vi.mocked(prisma)
const mockEnqueueEmail = vi.mocked(enqueueEmail)

/** Item de cronograma que abre e fecha a janela de recurso do resultado final. */
const janelaResultadoFinal = (inicio: string, fim: string) => [
  {
    tipo: 'custom',
    label: 'Período para recursos — seleção',
    acao: 'RECURSO_RESULTADO_FINAL_JANELA',
    dataHora: inicio,
    fimEm: fim,
  },
]

describe('decisão de recurso não vaza antes da publicação', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function arrangeDecisao(editalStatus: string, faseRecurso: string) {
    mockPrisma.recurso.findUnique.mockResolvedValue({
      id: 'rec-1',
      inscricaoId: 'insc-1',
      fase: faseRecurso,
      decisao: null,
    } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      numero: 'PNAB-2026-0139',
      proponente: { nome: 'Fulano', email: 'fulano@example.com' },
      edital: { titulo: 'Festival', status: editalStatus },
    } as never)
  }

  it('recurso do resultado final julgado ainda em RESULTADO_PRELIMINAR não dispara e-mail', async () => {
    arrangeDecisao('RESULTADO_PRELIMINAR', 'RESULTADO_FINAL')

    await decideRecurso('insc-1', 'rec-1', { decisao: 'INDEFERIDO', justificativa: 'Nota mantida.' }, 'admin-1')

    // A decisão é gravada normalmente — o que não pode é chegar ao proponente.
    expect(mockPrisma.recurso.update).toHaveBeenCalled()
    expect(mockEnqueueEmail).not.toHaveBeenCalled()
  })

  it('recurso do resultado preliminar julgado durante a fase RECURSO não dispara e-mail', async () => {
    arrangeDecisao('RECURSO', 'RESULTADO_PRELIMINAR')

    await decideRecurso('insc-1', 'rec-1', { decisao: 'DEFERIDO', justificativa: 'Revisão acolhida.' }, 'admin-1')

    expect(mockEnqueueEmail).not.toHaveBeenCalled()
  })

  it('a mesma decisão dispara e-mail depois que o edital chega a RESULTADO_FINAL', async () => {
    arrangeDecisao('RESULTADO_FINAL', 'RESULTADO_PRELIMINAR')

    await decideRecurso('insc-1', 'rec-1', { decisao: 'DEFERIDO', justificativa: 'Revisão acolhida.' }, 'admin-1')

    expect(mockEnqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'fulano@example.com',
        template: 'recurso_decidido',
        data: expect.objectContaining({ decisao: 'DEFERIDO' }),
      }),
    )
  })

  it('recurso de habilitação continua avisando na própria fase HABILITACAO', async () => {
    arrangeDecisao('HABILITACAO', 'HABILITACAO')

    await decideRecurso('insc-1', 'rec-1', { decisao: 'INDEFERIDO', justificativa: 'Documento ausente.' }, 'admin-1')

    expect(mockEnqueueEmail).toHaveBeenCalled()
  })
})

describe('submitRecurso respeita a janela e preserva o resultado publicado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.recurso.findFirst.mockResolvedValue(null as never)
    mockPrisma.recurso.create.mockResolvedValue({ id: 'rec-novo' } as never)
    mockPrisma.user.findMany.mockResolvedValue([] as never)
  })

  function arrangeInscricao(cronograma: unknown) {
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      proponenteId: 'user-1',
      status: 'SUPLENTE',
      editalId: 'ed-1',
      edital: { titulo: 'Festival', cronograma },
    } as never)
  }

  const dados = { fase: 'RESULTADO_FINAL', texto: 'x'.repeat(30), urlAnexos: [] }

  it('recusa recurso protocolado depois do fim da janela', async () => {
    vi.setSystemTime(new Date('2026-09-25T10:00:00-03:00'))
    arrangeInscricao(janelaResultadoFinal('2026-09-23T00:00', '2026-09-24T23:59'))

    await expect(submitRecurso('insc-1', dados, 'user-1')).rejects.toThrow(ServiceError)
    expect(mockPrisma.recurso.create).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('aceita dentro da janela e NÃO sobrescreve o status da inscrição', async () => {
    vi.setSystemTime(new Date('2026-09-23T12:00:00-03:00'))
    arrangeInscricao(janelaResultadoFinal('2026-09-23T00:00', '2026-09-24T23:59'))

    await submitRecurso('insc-1', dados, 'user-1')

    expect(mockPrisma.recurso.create).toHaveBeenCalled()
    // SUPLENTE é o resultado publicado da pessoa: virar RECURSO_ABERTO o
    // apagaria e ainda a carimbaria como "Em recurso" na lista pública.
    expect(mockPrisma.inscricao.update).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('edital sem a ação no cronograma segue aceitando (edital antigo)', async () => {
    arrangeInscricao([{ tipo: 'custom', label: 'Período para recursos', dataHora: '2026-09-23T00:00' }])

    await submitRecurso('insc-1', dados, 'user-1')

    expect(mockPrisma.recurso.create).toHaveBeenCalled()
  })
})
