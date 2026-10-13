import { describe, it, expect } from 'vitest'
import { podeTransicionar, pendenciasEvento, pendenciasExposicao, pendenciasItem } from '../publicacao'

const fotoCompleta = {
  tipo: 'FOTOGRAFIA' as const,
  titulo: 'Praça Clériston Andrade',
  descricao: null,
  legenda: null,
  arquivoUrl: '/api/arquivos/memorial/acervo/a.jpg',
  credito: 'Acervo da família Dourado',
  autorizado: true,
}

describe('fluxo editorial do Memorial', () => {
  it('não publica direto do rascunho: precisa de revisão e aprovação', () => {
    expect(podeTransicionar('RASCUNHO', 'PUBLICADO')).toBe(false)
    expect(podeTransicionar('RASCUNHO', 'EM_REVISAO')).toBe(true)
    expect(podeTransicionar('EM_REVISAO', 'APROVADO')).toBe(true)
    expect(podeTransicionar('APROVADO', 'PUBLICADO')).toBe(true)
  })

  it('publicado pode ser despublicado (volta a aprovado) ou arquivado', () => {
    expect(podeTransicionar('PUBLICADO', 'APROVADO')).toBe(true)
    expect(podeTransicionar('PUBLICADO', 'ARQUIVADO')).toBe(true)
    expect(podeTransicionar('ARQUIVADO', 'PUBLICADO')).toBe(false)
  })
})

describe('campos mínimos para publicar', () => {
  it('foto sem autorização de uso ou sem crédito não publica', () => {
    expect(pendenciasItem(fotoCompleta)).toEqual([])
    expect(pendenciasItem({ ...fotoCompleta, autorizado: false })).toContain('autorização de uso')
    expect(pendenciasItem({ ...fotoCompleta, credito: '  ' })).toContain('crédito')
    expect(pendenciasItem({ ...fotoCompleta, arquivoUrl: null })).toContain('arquivo da fotografia')
  })

  it('item que não é foto pede descrição ou legenda, sem exigir autorização', () => {
    const doc = { ...fotoCompleta, tipo: 'DOCUMENTO' as const, autorizado: false, credito: null }
    expect(pendenciasItem(doc)).toEqual(['descrição ou legenda'])
    expect(pendenciasItem({ ...doc, legenda: 'Ata de fundação' })).toEqual([])
  })

  it('exposição sem capa e evento sem ano ficam de fora', () => {
    expect(pendenciasExposicao({ titulo: 'São João', descricao: 'Texto', capaUrl: null })).toEqual(['imagem de capa'])
    expect(pendenciasEvento({ titulo: 'Primeiro desfile de carroças', descricao: 'Texto', ano: null })).toEqual(['ano'])
  })
})
