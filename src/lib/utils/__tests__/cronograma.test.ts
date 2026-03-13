import { describe, it, expect } from 'vitest'
import { isFaseCompleted, isFaseCurrent } from '../cronograma'

describe('isFaseCompleted', () => {
  it('fase anterior ao status atual → true', () => {
    expect(isFaseCompleted('PUBLICADO', 'INSCRICOES_ABERTAS')).toBe(true)
    expect(isFaseCompleted('INSCRICOES_ABERTAS', 'HABILITACAO')).toBe(true)
    expect(isFaseCompleted('AVALIACAO', 'RESULTADO_FINAL')).toBe(true)
  })

  it('fase igual ao status atual → false (em andamento, não concluída)', () => {
    expect(isFaseCompleted('INSCRICOES_ABERTAS', 'INSCRICOES_ABERTAS')).toBe(false)
    expect(isFaseCompleted('HABILITACAO', 'HABILITACAO')).toBe(false)
    expect(isFaseCompleted('AVALIACAO', 'AVALIACAO')).toBe(false)
  })

  it('ENCERRADO é terminal — concluído quando edital está ENCERRADO', () => {
    expect(isFaseCompleted('ENCERRADO', 'ENCERRADO')).toBe(true)
  })

  it('fase posterior ao status atual → false', () => {
    expect(isFaseCompleted('RESULTADO_FINAL', 'INSCRICOES_ABERTAS')).toBe(false)
    expect(isFaseCompleted('ENCERRADO', 'HABILITACAO')).toBe(false)
  })

  it('status desconhecido → false', () => {
    expect(isFaseCompleted('INVALIDO' as never, 'PUBLICADO')).toBe(false)
    expect(isFaseCompleted('PUBLICADO', 'INVALIDO' as never)).toBe(false)
  })
})

describe('isFaseCurrent', () => {
  it('fase igual ao status atual → true', () => {
    expect(isFaseCurrent('INSCRICOES_ABERTAS', 'INSCRICOES_ABERTAS')).toBe(true)
    expect(isFaseCurrent('HABILITACAO', 'HABILITACAO')).toBe(true)
    expect(isFaseCurrent('AVALIACAO', 'AVALIACAO')).toBe(true)
    expect(isFaseCurrent('RECURSO', 'RECURSO')).toBe(true)
  })

  it('ENCERRADO nunca é "em andamento" — é estado terminal', () => {
    expect(isFaseCurrent('ENCERRADO', 'ENCERRADO')).toBe(false)
  })

  it('fase diferente do status atual → false', () => {
    expect(isFaseCurrent('PUBLICADO', 'INSCRICOES_ABERTAS')).toBe(false)
    expect(isFaseCurrent('RESULTADO_FINAL', 'HABILITACAO')).toBe(false)
  })

  it('status desconhecido → false', () => {
    expect(isFaseCurrent('INVALIDO' as never, 'PUBLICADO')).toBe(false)
  })
})
