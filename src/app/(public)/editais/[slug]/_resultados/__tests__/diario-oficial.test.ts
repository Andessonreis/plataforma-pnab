import { describe, it, expect } from 'vitest'
import { escolherDiarioOficial, rotuloDiarioOficial } from '../diario-oficial'

const PRELIMINAR = 'https://procede.api.br/pdfGateway/irece/publicacoes/Diario%20Oficial%20-%20PREFEITURA%20MUNICIPAL%20DE%20IRECE%20-%20Ed%202935.pdf'
const FINAL = 'https://procede.api.br/pdfGateway/irece/publicacoes/Diario%20Oficial%20-%20PREFEITURA%20MUNICIPAL%20DE%20IRECE%20-%20Ed%202940.pdf'

const cronograma = [
  { tipo: 'custom', label: 'Publicação dos Projetos Selecionados', acao: 'PUBLICACAO_RESULTADO_PRELIMINAR', diarioOficialUrl: PRELIMINAR },
  { tipo: 'custom', label: 'Resultado Final após recurso', acao: 'PUBLICACAO_RESULTADO_FINAL' },
]

describe('Diário Oficial da página de resultados', () => {
  it('no preliminar usa o marco de publicação do preliminar', () => {
    expect(escolherDiarioOficial(cronograma, true)).toBe(PRELIMINAR)
  })

  it('no final não reaproveita o Diário do preliminar enquanto o do final não foi cadastrado', () => {
    expect(escolherDiarioOficial(cronograma, false)).toBeNull()
  })

  it('no final usa o link do marco de publicação do resultado final', () => {
    const comFinal = [
      cronograma[0],
      { ...cronograma[1], diarioOficialUrl: FINAL },
    ]
    expect(escolherDiarioOficial(comFinal, false)).toBe(FINAL)
    expect(escolherDiarioOficial(comFinal, true)).toBe(PRELIMINAR)
  })

  it('no preliminar, marco sem ação ainda serve como último recurso', () => {
    const semAcao = [{ tipo: 'custom', label: 'Publicação', diarioOficialUrl: PRELIMINAR }]
    expect(escolherDiarioOficial(semAcao, true)).toBe(PRELIMINAR)
    expect(escolherDiarioOficial(semAcao, false)).toBeNull()
  })

  it('no preliminar, o marco do resultado final não serve de último recurso', () => {
    const soFinal = [{ tipo: 'custom', label: 'Final', acao: 'PUBLICACAO_RESULTADO_FINAL', diarioOficialUrl: FINAL }]
    expect(escolherDiarioOficial(soFinal, true)).toBeNull()
  })

  it('ignora cronograma malformado e links vazios', () => {
    expect(escolherDiarioOficial(null, true)).toBeNull()
    expect(escolherDiarioOficial('texto', false)).toBeNull()
    expect(escolherDiarioOficial([null, 3, { acao: 'PUBLICACAO_RESULTADO_FINAL', diarioOficialUrl: '' }], false)).toBeNull()
  })

  it('escreve o número da edição a partir do endereço do gateway', () => {
    expect(rotuloDiarioOficial(PRELIMINAR)).toBe('Diário Oficial (Edição nº 2.935)')
    expect(rotuloDiarioOficial(FINAL)).toBe('Diário Oficial (Edição nº 2.940)')
  })

  it('aceita "Ed." com ponto e maiúsculas ou minúsculas', () => {
    expect(rotuloDiarioOficial('https://exemplo.gov.br/diario-Ed.2941.pdf')).toBe('Diário Oficial (Edição nº 2.941)')
    expect(rotuloDiarioOficial('https://exemplo.gov.br/diario-ed 2942.pdf')).toBe('Diário Oficial (Edição nº 2.942)')
  })

  it('endereço com % solto não lança erro', () => {
    expect(rotuloDiarioOficial('https://exemplo.gov.br/Ed%202935%.pdf')).toBe('Diário Oficial')
    expect(rotuloDiarioOficial('https://exemplo.gov.br/Ed 2935 100%.pdf')).toBe('Diário Oficial (Edição nº 2.935)')
  })

  it('sem número de edição no endereço, mostra só o nome', () => {
    expect(rotuloDiarioOficial('https://exemplo.gov.br/diario.pdf')).toBe('Diário Oficial')
  })
})
