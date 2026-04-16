import { describe, it, expect } from 'vitest'
import type { InscricaoStatus, EditalStatus } from '@prisma/client'
import {
  inscricaoStatusLabel,
  inscricaoStatusVariant,
  cumulativeStatuses,
  editalStatusLabel,
  editalStatusVariant,
  editalCronogramaLabel,
} from '@/lib/status-maps'

const ALL_INSCRICAO_STATUSES: InscricaoStatus[] = [
  'RASCUNHO', 'ENVIADA', 'HABILITADA', 'INABILITADA', 'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL',
  'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE',
]

const ALL_EDITAL_STATUSES: EditalStatus[] = [
  'RASCUNHO', 'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
  'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
  'RESULTADO_FINAL', 'ENCERRADO',
]

describe('inscricaoStatusLabel', () => {
  it('cobre todos os valores do enum sem undefined', () => {
    for (const s of ALL_INSCRICAO_STATUSES) {
      expect(inscricaoStatusLabel[s]).toBeDefined()
      expect(inscricaoStatusLabel[s]).not.toBe('')
    }
  })

  it('usa textos em português', () => {
    expect(inscricaoStatusLabel.CONTEMPLADA).toBe('Contemplada')
    expect(inscricaoStatusLabel.NAO_CONTEMPLADA).toBe('Não Contemplada')
    expect(inscricaoStatusLabel.EM_AVALIACAO).toBe('Em Avaliação')
  })
})

describe('inscricaoStatusVariant', () => {
  it('cobre todos os valores do enum', () => {
    for (const s of ALL_INSCRICAO_STATUSES) {
      expect(inscricaoStatusVariant[s]).toBeDefined()
    }
  })

  it('usa success para status positivos e error para negativos', () => {
    expect(inscricaoStatusVariant.HABILITADA).toBe('success')
    expect(inscricaoStatusVariant.CONTEMPLADA).toBe('success')
    expect(inscricaoStatusVariant.INABILITADA).toBe('error')
    expect(inscricaoStatusVariant.NAO_CONTEMPLADA).toBe('error')
  })
})

describe('cumulativeStatuses', () => {
  it('cobre todos os valores do enum', () => {
    for (const s of ALL_INSCRICAO_STATUSES) {
      expect(cumulativeStatuses[s]).toBeDefined()
      expect(cumulativeStatuses[s].length).toBeGreaterThan(0)
    }
  })

  it('sempre inclui o próprio status na lista', () => {
    for (const s of ALL_INSCRICAO_STATUSES) {
      expect(cumulativeStatuses[s]).toContain(s)
    }
  })

  it('HABILITADA inclui status de fases posteriores', () => {
    expect(cumulativeStatuses.HABILITADA).toContain('EM_AVALIACAO')
    expect(cumulativeStatuses.HABILITADA).toContain('CONTEMPLADA')
    expect(cumulativeStatuses.HABILITADA).toContain('SUPLENTE')
    expect(cumulativeStatuses.HABILITADA).toContain('NAO_CONTEMPLADA')
  })

  it('HABILITADA NÃO inclui INABILITADA', () => {
    expect(cumulativeStatuses.HABILITADA).not.toContain('INABILITADA')
  })

  it('HABILITADA NÃO inclui RASCUNHO nem ENVIADA (fases anteriores)', () => {
    expect(cumulativeStatuses.HABILITADA).not.toContain('RASCUNHO')
    expect(cumulativeStatuses.HABILITADA).not.toContain('ENVIADA')
  })

  it('EM_AVALIACAO inclui RESULTADO_PRELIMINAR em diante', () => {
    expect(cumulativeStatuses.EM_AVALIACAO).toContain('RESULTADO_PRELIMINAR')
    expect(cumulativeStatuses.EM_AVALIACAO).toContain('CONTEMPLADA')
    expect(cumulativeStatuses.EM_AVALIACAO).not.toContain('HABILITADA')
  })

  it('RESULTADO_FINAL inclui CONTEMPLADA, SUPLENTE e NAO_CONTEMPLADA', () => {
    expect(cumulativeStatuses.RESULTADO_FINAL).toEqual(
      expect.arrayContaining(['RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE']),
    )
  })

  it('status terminais têm correspondência exata', () => {
    expect(cumulativeStatuses.INABILITADA).toEqual(['INABILITADA'])
    expect(cumulativeStatuses.CONTEMPLADA).toEqual(['CONTEMPLADA'])
    expect(cumulativeStatuses.NAO_CONTEMPLADA).toEqual(['NAO_CONTEMPLADA'])
    expect(cumulativeStatuses.SUPLENTE).toEqual(['SUPLENTE'])
    expect(cumulativeStatuses.RASCUNHO).toEqual(['RASCUNHO'])
    expect(cumulativeStatuses.ENVIADA).toEqual(['ENVIADA'])
  })
})

describe('editalStatusLabel', () => {
  it('cobre todos os valores do enum sem undefined', () => {
    for (const s of ALL_EDITAL_STATUSES) {
      expect(editalStatusLabel[s]).toBeDefined()
      expect(editalStatusLabel[s]).not.toBe('')
    }
  })

  it('usa textos em português', () => {
    expect(editalStatusLabel.INSCRICOES_ABERTAS).toBe('Inscrições Abertas')
    expect(editalStatusLabel.HABILITACAO).toBe('Habilitação')
  })
})

describe('editalStatusVariant', () => {
  it('cobre todos os valores do enum', () => {
    for (const s of ALL_EDITAL_STATUSES) {
      expect(editalStatusVariant[s]).toBeDefined()
    }
  })
})

describe('editalCronogramaLabel', () => {
  it('cobre todos os valores do enum sem undefined', () => {
    for (const s of ALL_EDITAL_STATUSES) {
      expect(editalCronogramaLabel[s]).toBeDefined()
      expect(editalCronogramaLabel[s]).not.toBe('')
    }
  })

  it('usa frases descritivas (não apenas o nome do status)', () => {
    expect(editalCronogramaLabel.INSCRICOES_ABERTAS).toBe('Início das Inscrições')
    expect(editalCronogramaLabel.RESULTADO_FINAL).toBe('Publicação do Resultado Final')
  })
})
