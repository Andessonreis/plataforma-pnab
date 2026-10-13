import { describe, expect, it } from 'vitest'
import { pendenciasItem } from '@/lib/memorial/publicacao'
import { acoesDaSituacao, indicePasso, juntarLista } from '../acervo-fluxo'

describe('acoesDaSituacao', () => {
  it('rascunho avança para revisão e pode ser arquivado', () => {
    const { principal, secundarias } = acoesDaSituacao('RASCUNHO')
    expect(principal).toEqual({ para: 'EM_REVISAO', rotulo: 'Enviar para revisão' })
    expect(secundarias.map((a) => a.para)).toEqual(['ARQUIVADO'])
  })

  it('aprovado tem publicar como único destaque', () => {
    const { principal, secundarias } = acoesDaSituacao('APROVADO')
    expect(principal?.para).toBe('PUBLICADO')
    expect(secundarias).toEqual([{ para: 'EM_REVISAO', rotulo: 'Devolver para revisão' }])
  })

  it('publicado não avança: só tira do site ou arquiva', () => {
    const { principal, secundarias } = acoesDaSituacao('PUBLICADO')
    expect(principal).toBeNull()
    expect(secundarias.map((a) => a.rotulo)).toEqual(['Tirar do site', 'Arquivar'])
  })

  it('arquivado reabre como rascunho', () => {
    expect(acoesDaSituacao('ARQUIVADO').principal).toEqual({ para: 'RASCUNHO', rotulo: 'Reabrir como rascunho' })
  })
})

describe('indicePasso', () => {
  it('posiciona as etapas da trilha e deixa arquivado de fora', () => {
    expect(indicePasso('RASCUNHO')).toBe(0)
    expect(indicePasso('PUBLICADO')).toBe(3)
    expect(indicePasso('ARQUIVADO')).toBe(-1)
  })
})

describe('juntarLista', () => {
  it('junta pendências em português', () => {
    expect(juntarLista([])).toBe('')
    expect(juntarLista(['crédito'])).toBe('crédito')
    expect(juntarLista(['título', 'crédito', 'autorização de uso'])).toBe('título, crédito e autorização de uso')
  })

  it('lê as pendências da regra de publicação sem recalcular', () => {
    const falta = pendenciasItem({
      tipo: 'FOTOGRAFIA',
      titulo: 'Praça',
      descricao: null,
      legenda: null,
      arquivoUrl: '/api/arquivos/memorial/a.jpg',
      credito: '',
      autorizado: false,
    })
    expect(juntarLista(falta)).toBe('crédito e autorização de uso')
  })
})
