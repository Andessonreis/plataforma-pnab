import { describe, it, expect } from 'vitest'
import {
  podeHabilitar,
  podeAvaliar,
  podeAtribuirAvaliador,
  podeAcao,
  mensagemForaDaFase,
} from '../fase'

describe('podeHabilitar', () => {
  it('libera apenas em HABILITACAO', () => {
    expect(podeHabilitar('HABILITACAO')).toBe(true)
  })

  it.each([
    'RASCUNHO',
    'PUBLICADO',
    'INSCRICOES_ABERTAS',
    'INSCRICOES_ENCERRADAS',
    'AVALIACAO',
    'RESULTADO_PRELIMINAR',
    'RECURSO',
    'RESULTADO_FINAL',
    'ENCERRADO',
  ] as const)('bloqueia em %s', (status) => {
    expect(podeHabilitar(status)).toBe(false)
  })
})

describe('podeAvaliar', () => {
  it('libera apenas em AVALIACAO', () => {
    expect(podeAvaliar('AVALIACAO')).toBe(true)
  })

  it.each([
    'RASCUNHO',
    'INSCRICOES_ABERTAS',
    'HABILITACAO',
    'RESULTADO_PRELIMINAR',
    'RECURSO',
    'ENCERRADO',
  ] as const)('bloqueia em %s', (status) => {
    expect(podeAvaliar(status)).toBe(false)
  })
})

describe('podeAtribuirAvaliador', () => {
  it('libera apenas em AVALIACAO', () => {
    expect(podeAtribuirAvaliador('AVALIACAO')).toBe(true)
    expect(podeAtribuirAvaliador('HABILITACAO')).toBe(false)
    expect(podeAtribuirAvaliador('RESULTADO_PRELIMINAR')).toBe(false)
  })
})

describe('podeAcao', () => {
  it('roteia para a função certa', () => {
    expect(podeAcao('HABILITACAO', 'habilitar')).toBe(true)
    expect(podeAcao('AVALIACAO', 'avaliar')).toBe(true)
    expect(podeAcao('AVALIACAO', 'atribuir_avaliador')).toBe(true)
    expect(podeAcao('HABILITACAO', 'avaliar')).toBe(false)
    expect(podeAcao('AVALIACAO', 'habilitar')).toBe(false)
  })
})

describe('mensagemForaDaFase', () => {
  it('habilitar antes da fase → ainda não iniciada', () => {
    expect(mensagemForaDaFase('INSCRICOES_ABERTAS', 'habilitar')).toBe('Habilitação ainda não iniciada')
  })

  it('habilitar depois da fase → encerrado', () => {
    expect(mensagemForaDaFase('AVALIACAO', 'habilitar')).toBe('Período de habilitação encerrado')
    expect(mensagemForaDaFase('RESULTADO_FINAL', 'habilitar')).toBe('Período de habilitação encerrado')
  })

  it('avaliar antes da fase → ainda não iniciada', () => {
    expect(mensagemForaDaFase('HABILITACAO', 'avaliar')).toBe('Avaliação ainda não iniciada')
    expect(mensagemForaDaFase('RASCUNHO', 'avaliar')).toBe('Avaliação ainda não iniciada')
  })

  it('avaliar depois da fase → encerrado', () => {
    expect(mensagemForaDaFase('RESULTADO_PRELIMINAR', 'avaliar')).toBe('Período de avaliação encerrado')
    expect(mensagemForaDaFase('ENCERRADO', 'avaliar')).toBe('Período de avaliação encerrado')
  })

  it('atribuir_avaliador segue regra de avaliação', () => {
    expect(mensagemForaDaFase('HABILITACAO', 'atribuir_avaliador')).toBe('Avaliação ainda não iniciada')
    expect(mensagemForaDaFase('RESULTADO_FINAL', 'atribuir_avaliador')).toBe('Período de avaliação encerrado')
  })
})
