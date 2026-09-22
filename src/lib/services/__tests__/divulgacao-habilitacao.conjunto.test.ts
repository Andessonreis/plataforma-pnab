import { describe, it, expect, vi, beforeEach } from 'vitest'
import { divulgarResultadoHabilitacao } from '../divulgacao-habilitacao.service'
import {
  STATUS_DIVULGAVEIS,
  entrada,
  listaDeStatus,
  prepararCenarioPadrao,
  tx,
} from './divulgacao-habilitacao.fixtures'

vi.mock('@/lib/db', () => ({
  prisma: {
    edital: { findUnique: vi.fn() },
    inscricao: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

describe('divulgação — quais inscrições entram', () => {
  beforeEach(prepararCenarioPadrao)

  it('libera o mesmo conjunto que a lista pública considera habilitado, ainda não divulgado', async () => {
    await divulgarResultadoHabilitacao(entrada)

    const { where, data } = tx.inscricao.updateMany.mock.calls[0][0]
    expect(where).toEqual({
      editalId: 'ed-1',
      status: { in: STATUS_DIVULGAVEIS },
      resultadoLiberadoEm: null,
    })
    expect(data).toEqual({ resultadoLiberadoEm: expect.any(Date) })
    expect(listaDeStatus(where)).toEqual(
      expect.arrayContaining(['HABILITADA', 'INABILITADA', 'EM_AVALIACAO', 'CONTEMPLADA']),
    )
  })

  it('deixa ENVIADA e RASCUNHO de fora da divulgação', async () => {
    await divulgarResultadoHabilitacao(entrada)

    const { where } = tx.inscricao.updateMany.mock.calls[0][0]
    expect(listaDeStatus(where)).not.toContain('ENVIADA')
    expect(listaDeStatus(where)).not.toContain('RASCUNHO')
  })

  it('deixa RECURSO_ABERTO de fora: quem recorreu já viu o resultado e não pode virar "habilitada"', async () => {
    await divulgarResultadoHabilitacao(entrada)

    const { where } = tx.inscricao.updateMany.mock.calls[0][0]
    expect(listaDeStatus(where)).not.toContain('RECURSO_ABERTO')
  })

  it('busca as divulgadas pela mesma marca de tempo gravada, para avisar só quem esta chamada liberou', async () => {
    await divulgarResultadoHabilitacao(entrada)

    const { data } = tx.inscricao.updateMany.mock.calls[0][0]
    expect(tx.inscricao.findMany.mock.calls[0][0].where).toEqual({
      editalId: 'ed-1',
      resultadoLiberadoEm: data.resultadoLiberadoEm,
    })
  })
})
