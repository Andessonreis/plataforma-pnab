import { describe, it, expect } from 'vitest'
import type { EditalStatus } from '@prisma/client'
import { ETAPAS_RECURSO_CHAVES, etapaComExtrato, type EtapaRecurso } from '../etapas-recurso'

const FASES_EM_ORDEM: EditalStatus[] = [
  'RASCUNHO',
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

function fasesComExtrato(etapa: EtapaRecurso): EditalStatus[] {
  return FASES_EM_ORDEM.filter((fase) => etapaComExtrato(etapa, fase))
}

describe('etapaComExtrato', () => {
  it('habilitação: a partir da fase de habilitação', () => {
    expect(fasesComExtrato('habilitacao')).toEqual([
      'HABILITACAO',
      'AVALIACAO',
      'RESULTADO_PRELIMINAR',
      'RECURSO',
      'RESULTADO_FINAL',
      'ENCERRADO',
    ])
  })

  it('seleção: só a partir do resultado preliminar, pois antes o prazo dela é garantidamente recusado', () => {
    expect(fasesComExtrato('selecao')).toEqual([
      'RESULTADO_PRELIMINAR',
      'RECURSO',
      'RESULTADO_FINAL',
      'ENCERRADO',
    ])
  })

  it.each(ETAPAS_RECURSO_CHAVES)('rascunho nunca oferece o extrato de %s', (etapa) => {
    expect(etapaComExtrato(etapa, 'RASCUNHO')).toBe(false)
  })

  it('a etapa mais tardia nunca abre antes da mais cedo', () => {
    for (const fase of FASES_EM_ORDEM) {
      if (etapaComExtrato('selecao', fase)) expect(etapaComExtrato('habilitacao', fase)).toBe(true)
    }
  })
})
