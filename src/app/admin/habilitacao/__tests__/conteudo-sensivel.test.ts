import { describe, it, expect } from 'vitest'
import { filtrarConteudoSensivel } from '../[id]/conteudo-sensivel'

const conteudo = {
  etapas: [{ titulo: 'Dados do Projeto' }, { titulo: 'Plano de Trabalho' }],
  anexos: [
    { tipo: 'Documento de identidade', titulo: 'RG' },
    { tipo: 'Plano de Trabalho', titulo: 'Plano' },
    { tipo: 'Anexo', titulo: 'Planilha Orçamentária 2026' },
  ],
  pendentes: [
    { tipo: 'comprovante', label: 'Comprovante de residência' },
    { tipo: 'planilha', label: 'Planilha orçamentária' },
  ],
}

describe('conteúdo sensível na conferência de habilitação', () => {
  it('quem pode ver recebe tudo, sem filtro', () => {
    expect(filtrarConteudoSensivel(conteudo, true)).toBe(conteudo)
  })

  it('quem não pode ver fica sem Plano de Trabalho e Planilha Orçamentária, com ou sem acento', () => {
    const filtrado = filtrarConteudoSensivel(conteudo, false)

    expect(filtrado.etapas).toEqual([{ titulo: 'Dados do Projeto' }])
    expect(filtrado.anexos).toEqual([{ tipo: 'Documento de identidade', titulo: 'RG' }])
    expect(filtrado.pendentes).toEqual([{ tipo: 'comprovante', label: 'Comprovante de residência' }])
  })

  it('não altera o conteúdo original', () => {
    filtrarConteudoSensivel(conteudo, false)

    expect(conteudo.etapas).toHaveLength(2)
    expect(conteudo.anexos).toHaveLength(3)
  })
})
