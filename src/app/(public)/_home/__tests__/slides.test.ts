import { describe, it, expect } from 'vitest'
import { slideDoRegistro } from '../slides'

const registroPeca = {
  id: 'abc',
  formato: 'PECA' as const,
  titulo: 'Memorial de Irecê',
  descricao: 'Uma história contada, vivida e preservada.',
  imagemUrl: '/images/cidade/panoramica-irece.jpg',
  ctaLabel: 'Agendar visita',
  ctaUrl: '/memorial/agendar',
  peca: { chamada: 'Tudo que a memória amou', linhas: [] },
}

describe('slideDoRegistro', () => {
  it('peça vira slide de faixa inteira com apoio e fundo vindos das colunas comuns', () => {
    const slide = slideDoRegistro(registroPeca)
    expect(slide?.tipo).toBe('peca')
    if (slide?.tipo !== 'peca') return
    expect(slide.id).toBe('slide-abc')
    expect(slide.peca.apoio).toBe(registroPeca.descricao)
    expect(slide.peca.fundo).toBe(registroPeca.imagemUrl)
    expect(slide.peca.varal).toBeNull()
  })

  it('peça com JSON fora do contrato ou sem botão some da home em vez de quebrar', () => {
    expect(slideDoRegistro({ ...registroPeca, peca: { chamada: '' } })).toBeNull()
    expect(slideDoRegistro({ ...registroPeca, peca: null })).toBeNull()
    expect(slideDoRegistro({ ...registroPeca, ctaUrl: null })).toBeNull()
  })

  it('arte mantém o comportamento antigo: sem imagem não entra, sem botão usa o padrão', () => {
    const arte = { ...registroPeca, formato: 'ARTE' as const, peca: null, ctaLabel: null, ctaUrl: null }
    expect(slideDoRegistro({ ...arte, imagemUrl: null })).toBeNull()
    expect(slideDoRegistro(arte)).toMatchObject({ tipo: 'arte', ctaLabel: 'Saiba mais', ctaUrl: '/editais' })
  })
})
