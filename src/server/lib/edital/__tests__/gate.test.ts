import { describe, it, expect } from 'vitest'
import { gateAcaoFase } from '../gate'

describe('gateAcaoFase', () => {
  it('libera dentro da fase sem override', () => {
    const r = gateAcaoFase({ editalStatus: 'AVALIACAO', acao: 'avaliar', role: 'AVALIADOR' })
    expect(r).toEqual({ ok: true, overrideUsed: false })
  })

  it('bloqueia AVALIADOR fora da fase mesmo com override=true', () => {
    const r = gateAcaoFase({
      editalStatus: 'HABILITACAO',
      acao: 'avaliar',
      role: 'AVALIADOR',
      override: true,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.mensagem).toContain('iniciada')
  })

  it('bloqueia HABILITADOR fora da fase', () => {
    const r = gateAcaoFase({
      editalStatus: 'AVALIACAO',
      acao: 'habilitar',
      role: 'HABILITADOR',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.mensagem).toContain('encerrado')
  })

  it('bloqueia ADMIN sem override fora da fase', () => {
    const r = gateAcaoFase({
      editalStatus: 'INSCRICOES_ABERTAS',
      acao: 'habilitar',
      role: 'ADMIN',
    })
    expect(r.ok).toBe(false)
  })

  it('libera ADMIN com override=true fora da fase + marca overrideUsed', () => {
    const r = gateAcaoFase({
      editalStatus: 'RESULTADO_FINAL',
      acao: 'habilitar',
      role: 'ADMIN',
      override: true,
    })
    expect(r).toEqual({ ok: true, overrideUsed: true })
  })

  it('mesmo ADMIN dentro da fase não marca override', () => {
    const r = gateAcaoFase({
      editalStatus: 'AVALIACAO',
      acao: 'avaliar',
      role: 'ADMIN',
      override: true,
    })
    expect(r).toEqual({ ok: true, overrideUsed: false })
  })

  it('atribuir_avaliador segue regra de avaliação', () => {
    expect(
      gateAcaoFase({ editalStatus: 'AVALIACAO', acao: 'atribuir_avaliador', role: 'ADMIN' }),
    ).toEqual({ ok: true, overrideUsed: false })

    expect(
      gateAcaoFase({ editalStatus: 'HABILITACAO', acao: 'atribuir_avaliador', role: 'ADMIN' }).ok,
    ).toBe(false)
  })
})
