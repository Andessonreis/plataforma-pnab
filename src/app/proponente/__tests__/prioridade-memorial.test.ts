import { describe, it, expect } from 'vitest'
import { posicaoDoMemorial } from '@/app/proponente/prioridade-memorial'

describe('posicaoDoMemorial', () => {
  it('conta só do Memorial abre o painel pelo Memorial, mesmo com prazo de edital alheio', () => {
    expect(posicaoDoMemorial({ temVisitasPorVir: true, totalInscricoes: 0, tomAgora: 'prazo' })).toBe('memorial-agora')
    expect(posicaoDoMemorial({ temVisitasPorVir: false, totalInscricoes: 0, tomAgora: 'livre' })).toBe('memorial-agora')
  })

  it('com inscrições e visita marcada, o Memorial vem logo depois do agora', () => {
    for (const tomAgora of ['recurso', 'prazo', 'rascunho', 'abertos', 'livre'] as const) {
      expect(posicaoDoMemorial({ temVisitasPorVir: true, totalInscricoes: 3, tomAgora })).toBe('agora-memorial')
    }
  })

  it('recurso nunca perde o topo', () => {
    expect(posicaoDoMemorial({ temVisitasPorVir: true, totalInscricoes: 1, tomAgora: 'recurso' })).toBe('agora-memorial')
  })

  it('com inscrições e sem visita por vir, o convite fica compacto e abaixo', () => {
    expect(posicaoDoMemorial({ temVisitasPorVir: false, totalInscricoes: 2, tomAgora: 'prazo' })).toBe('memorial-abaixo')
    expect(posicaoDoMemorial({ temVisitasPorVir: false, totalInscricoes: 2, tomAgora: 'livre' })).toBe('memorial-abaixo')
  })
})
