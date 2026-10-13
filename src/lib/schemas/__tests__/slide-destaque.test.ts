import { describe, it, expect } from 'vitest'
import { LIMITES_SLIDE, slideSchema } from '../slide-destaque'

const peca = {
  chamada: 'Tudo que a memória amou',
  chamadaDestaque: 'já ficou eterno.',
  autoria: 'Adélia Prado',
  linhas: ['Grupos de até 20 pessoas.'],
  varal: { rotulo: 'Re-Tratos do Tempo', quantidade: '28', anoInicial: '1950', anoFinal: '1980' },
}

const pecaValida = {
  formato: 'PECA',
  titulo: 'Memorial de Irecê',
  descricao: 'Uma história contada, vivida e preservada.',
  imagemUrl: '/images/cidade/panoramica-irece.jpg',
  ctaLabel: 'Agendar visita',
  ctaUrl: '/memorial/agendar',
  peca,
}

function mensagens(dados: unknown) {
  const r = slideSchema.safeParse(dados)
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('slideSchema', () => {
  it('slide antigo sem formato continua valendo como ARTE', () => {
    const r = slideSchema.parse({ titulo: 'Slide de arte', imagemUrl: '/api/arquivos/editais/slides/a.png' })
    expect(r.formato).toBe('ARTE')
    expect(r.peca).toBeNull()
  })

  it('aceita a peça do Memorial e converte números do formulário', () => {
    const r = slideSchema.parse(pecaValida)
    expect(r.peca?.varal).toEqual({ rotulo: 'Re-Tratos do Tempo', quantidade: 28, anoInicial: 1950, anoFinal: 1980 })
    expect(r.peca?.ctaSecundario).toBeNull()
    expect(r.peca?.destaque).toBeNull()
  })

  it('peça exige fundo, botão principal e conteúdo', () => {
    const erros = mensagens({ ...pecaValida, imagemUrl: '', ctaLabel: '', ctaUrl: null, peca: null })
    expect(Object.keys(erros)).toEqual(expect.arrayContaining(['imagemUrl', 'ctaLabel', 'ctaUrl', 'peca']))
  })

  it('barra texto maior que o quadro comporta', () => {
    const erros = mensagens({
      ...pecaValida,
      peca: { ...peca, chamada: 'x'.repeat(LIMITES_SLIDE.chamada + 1), linhas: ['a', 'b', 'c', 'd'] },
    })
    expect(mensagens({ ...pecaValida, descricao: 'x'.repeat(LIMITES_SLIDE.apoio + 1) }).descricao).toMatch(/Máximo/)
    expect(erros['peca.chamada']).toMatch(/Máximo/)
    expect(erros['peca.linhas']).toMatch(/No máximo 3/)
  })

  it('texto de apoio longo continua aceito na arte', () => {
    expect(slideSchema.safeParse({ titulo: 'Arte', descricao: 'x'.repeat(LIMITES_SLIDE.apoio + 50) }).success).toBe(true)
  })

  it('recusa link de protocolo perigoso ou //host e aceita caminho interno e https', () => {
    expect(mensagens({ ...pecaValida, ctaUrl: 'javascript:alert(1)' }).ctaUrl).toBeDefined()
    expect(mensagens({ ...pecaValida, ctaUrl: '//evil.example' }).ctaUrl).toBeDefined()
    expect(slideSchema.safeParse({ ...pecaValida, ctaUrl: 'https://gov.br' }).success).toBe(true)
  })

  it('varal com ano final antes do inicial e foto colada sem descrição são recusados', () => {
    const erros = mensagens({
      ...pecaValida,
      peca: { ...peca, varal: { ...peca.varal, anoFinal: '1940' }, destaque: { url: '/x.jpg', alt: '' } },
    })
    expect(erros['peca.varal.anoFinal']).toMatch(/depois do inicial/)
    expect(erros['peca.destaque.alt']).toBeDefined()
  })

  it('janela de exibição com fim antes do início é recusada', () => {
    const erros = mensagens({ ...pecaValida, inicioEm: '2026-10-10T10:00', fimEm: '2026-10-01T10:00' })
    expect(erros.fimEm).toMatch(/depois do início/)
  })
})
