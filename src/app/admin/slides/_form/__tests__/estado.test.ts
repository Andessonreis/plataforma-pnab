import { describe, it, expect } from 'vitest'
import type { SlideDestaque } from '@prisma/client'
import { slideSchema } from '@/lib/schemas/slide-destaque'
import { formDoRegistro, formVazio, payloadDoForm, previaDoForm } from '../estado'

const registro: SlideDestaque = {
  id: 's1',
  formato: 'PECA',
  titulo: 'Memorial',
  descricao: 'Uma história contada.',
  imagemUrl: '/fundo.jpg',
  peca: {
    chamada: 'Tudo que a memória amou',
    chamadaDestaque: 'já ficou eterno.',
    autoria: 'Adélia Prado',
    apoioDestaque: null,
    ctaSecundario: { label: 'Conhecer', url: '/memorial' },
    destaque: { url: '/foto.jpg', alt: 'Fachada', legenda: 'Hoje' },
    linhas: ['Grupos de até 20 pessoas.'],
    varal: { rotulo: 'Re-Tratos', quantidade: 28, anoInicial: 1950, anoFinal: 1980 },
  },
  ctaLabel: 'Agendar',
  ctaUrl: '/memorial/agendar',
  ordem: 0,
  ativo: true,
  inicioEm: null,
  fimEm: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('estado do formulário de slide', () => {
  it('registro → formulário → payload devolve a mesma peça', () => {
    const corpo = slideSchema.parse(payloadDoForm(formDoRegistro(registro)))
    expect(corpo.formato).toBe('PECA')
    expect(corpo.peca).toEqual(registro.peca)
  })

  it('linhas vazias e segundo botão em branco não vão para a API', () => {
    const form = formDoRegistro(registro)
    form.peca.linhas = ['', '  ', 'Uma linha']
    form.peca.ctaSecundarioLabel = ''
    form.peca.ctaSecundarioUrl = ''
    form.peca.temVaral = false
    const corpo = payloadDoForm(form)
    expect(corpo.peca?.linhas).toEqual(['Uma linha'])
    expect(corpo.peca?.ctaSecundario).toBeNull()
    expect(corpo.peca?.varal).toBeNull()
  })

  it('arte não envia peça mesmo que o formulário guarde uma', () => {
    const form = { ...formDoRegistro(registro), formato: 'ARTE' as const }
    expect(payloadDoForm(form).peca).toBeNull()
  })

  it('prévia de formulário vazio mostra textos-guia no lugar dos obrigatórios', () => {
    const previa = previaDoForm({ ...formVazio(), formato: 'PECA' })
    expect(previa.tipo).toBe('peca')
    if (previa.tipo !== 'peca') return
    expect(previa.peca.chamada).toBe('Chamada da peça')
    expect(previa.ctaLabel).toBe('Botão principal')
  })
})
