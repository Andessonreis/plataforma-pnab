import { describe, it, expect } from 'vitest'
import { TRANSICOES } from '@/lib/memorial/publicacao'
import { indicePasso, outrosPassos, proximoPasso } from '../config-fluxo'

describe('passos de publicação do Memorial', () => {
  it('oferece um único próximo passo no caminho até o site', () => {
    expect(proximoPasso('RASCUNHO')?.para).toBe('EM_REVISAO')
    expect(proximoPasso('EM_REVISAO')?.para).toBe('APROVADO')
    expect(proximoPasso('APROVADO')?.para).toBe('PUBLICADO')
    expect(proximoPasso('ARQUIVADO')?.para).toBe('RASCUNHO')
    expect(proximoPasso('PUBLICADO')).toBeNull()
  })

  it('os demais botões cobrem exatamente as transições permitidas, sem repetir o próximo passo', () => {
    for (const status of Object.keys(TRANSICOES) as (keyof typeof TRANSICOES)[]) {
      const todos = [proximoPasso(status)?.para, ...outrosPassos(status).map((p) => p.para)].filter(Boolean)
      expect(new Set(todos)).toEqual(new Set(TRANSICOES[status]))
    }
  })

  it('dá nome em português a cada passo secundário', () => {
    expect(outrosPassos('PUBLICADO').map((p) => p.rotulo)).toEqual(['Tirar do site', 'Arquivar'])
    for (const status of Object.keys(TRANSICOES) as (keyof typeof TRANSICOES)[]) {
      for (const p of outrosPassos(status)) expect(p.rotulo).not.toMatch(/^[A-Z_]+$/)
    }
  })

  it('posiciona o status na trilha e deixa arquivado fora dela', () => {
    expect(indicePasso('RASCUNHO')).toBe(0)
    expect(indicePasso('PUBLICADO')).toBe(3)
    expect(indicePasso('ARQUIVADO')).toBe(-1)
  })
})
