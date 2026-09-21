import { describe, it, expect } from 'vitest'
import { tituloDe, type ListaInscricoesData } from '../lista-inscricoes'

function lista(parcial: Partial<ListaInscricoesData>): ListaInscricoesData {
  return {
    edital: { titulo: 'Edital de teste', ano: 2026 },
    status: 'INABILITADA',
    statusLabel: 'Inabilitada',
    inscricoes: [],
    total: 0,
    ...parcial,
  }
}

describe('tituloDe', () => {
  it('lista de habilitados leva o título de relação definitiva por padrão', () => {
    const titulo = tituloDe(lista({ status: 'HABILITADA', statusLabel: 'Habilitada' }))
    expect(titulo).toBe('Relação Definitiva de Habilitados')
  })

  it('tituloDocumento explícito tem precedência sobre o padrão do status', () => {
    const titulo = tituloDe(
      lista({ status: 'HABILITADA', statusLabel: 'Habilitada', tituloDocumento: 'Relação preliminar' }),
    )
    expect(titulo).toBe('Relação preliminar')
  })

  it('mantém os títulos dos demais status', () => {
    expect(tituloDe(lista({ status: 'ENVIADA', statusLabel: 'Enviada' }))).toBe('Relação de Inscritos')
    expect(tituloDe(lista({ status: 'RASCUNHO', statusLabel: 'Rascunho' }))).toBe('Relação de Inscrições em Rascunho')
    expect(tituloDe(lista({ status: 'INABILITADA', statusLabel: 'Inabilitada' }))).toBe('Relação de Inscrições — Inabilitada')
  })
})
