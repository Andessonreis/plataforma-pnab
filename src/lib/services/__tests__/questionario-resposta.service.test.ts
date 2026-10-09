import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Prisma } from '@prisma/client'
import { logAudit } from '@/lib/audit'
import { registrarRespostaQuestionario } from '../questionario-resposta.service'
import { db, questionarioPublicado } from '@/app/api/v1/questionarios/__tests__/fixtures'

function criarTx() {
  return {
    questionario: { findFirst: vi.fn().mockResolvedValue({ ...questionarioPublicado, status: 'RASCUNHO' }) },
    questionarioResposta: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'r1', protocolo: 'QST-2026-ABCDEF', createdAt: new Date() }),
    },
  }
}

beforeEach(() => vi.clearAllMocks())

describe('registrarRespostaQuestionario dentro de transação', () => {
  it('usa o tx de quem chama, aceita não publicado e não audita', async () => {
    const tx = criarTx()
    const r = await registrarRespostaQuestionario({ id: 'q1' }, { nome: 'Ana' }, {
      tx: tx as unknown as Prisma.TransactionClient,
      exigirPublicado: false,
      nome: 'Ana',
      email: 'ana@x.br',
    })
    expect(r.protocolo).toBe('QST-2026-ABCDEF')
    expect(tx.questionario.findFirst.mock.calls[0][0].where).toEqual({ id: 'q1' })
    expect(tx.questionarioResposta.create.mock.calls[0][0].data).toMatchObject({ nome: 'Ana', email: 'ana@x.br', versao: 2 })
    expect(db.questionarioResposta.create).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('aceita id ou slug como texto', async () => {
    const tx = criarTx()
    await registrarRespostaQuestionario('q1', { nome: 'Ana' }, { tx: tx as unknown as Prisma.TransactionClient, exigirPublicado: false })
    expect(tx.questionario.findFirst.mock.calls[0][0].where).toEqual({ OR: [{ id: 'q1' }, { slug: 'q1' }] })
  })

  it('por padrão recusa questionário não publicado', async () => {
    const tx = criarTx()
    await expect(
      registrarRespostaQuestionario({ id: 'q1' }, { nome: 'Ana' }, { tx: tx as unknown as Prisma.TransactionClient }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('propaga ZodError para respostas inválidas', async () => {
    const tx = criarTx()
    await expect(
      registrarRespostaQuestionario({ slug: 'x' }, {}, { tx: tx as unknown as Prisma.TransactionClient, exigirPublicado: false }),
    ).rejects.toHaveProperty('name', 'ZodError')
    expect(tx.questionarioResposta.create).not.toHaveBeenCalled()
  })
})
