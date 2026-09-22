import { describe, it, expect } from 'vitest'
import { abrirDocumento, garantirEspaco, LIMITE_CONTEUDO } from '../pagina'
import { calcularAlturaLinha, type ColunaTabela } from '../tabela'

/**
 * Cálculo de altura de linha e decisão de quebra — a parte da tabela que não
 * depende do desenho e responde por linha cortada e texto sobreposto.
 */

const COLUNAS: ColunaTabela[] = [
  { label: 'Protocolo', width: 80 },
  { label: 'Motivo', width: 110 },
]

function documento(): PDFKit.PDFDocument {
  return abrirDocumento({ titulo: 'Documento de teste' })
}

describe('calcularAlturaLinha', () => {
  it('texto curto fica na altura mínima da linha', () => {
    const doc = documento()

    expect(calcularAlturaLinha(doc, COLUNAS, ['PNAB-2026-0001', 'Deferido'])).toBe(18)
  })

  it('texto que não cabe na largura da coluna aumenta a linha', () => {
    const doc = documento()
    const motivo = 'Documentação incompleta: falta comprovante de residência e '
      + 'o projeto não apresenta planilha orçamentária assinada pelo proponente.'

    const altura = calcularAlturaLinha(doc, COLUNAS, ['PNAB-2026-0001', motivo])

    expect(altura).toBeGreaterThan(18)
  })

  it('a linha acompanha a célula mais alta, não a primeira', () => {
    const doc = documento()
    const longo = 'Motivo bem extenso que ocupa várias linhas dentro da coluna estreita reservada a ele.'

    const alturaComLongoNoFim = calcularAlturaLinha(doc, COLUNAS, ['PNAB-2026-0001', longo])
    const alturaComLongoNoInicio = calcularAlturaLinha(doc, COLUNAS, [longo, 'Deferido'])

    expect(alturaComLongoNoFim).toBeGreaterThan(18)
    expect(alturaComLongoNoInicio).toBeGreaterThan(18)
  })

  it('célula ausente não derruba o cálculo', () => {
    const doc = documento()

    expect(calcularAlturaLinha(doc, COLUNAS, ['PNAB-2026-0001'])).toBe(18)
  })
})

describe('garantirEspaco', () => {
  it('não quebra quando o bloco cabe no que restou da folha', () => {
    const doc = documento()
    doc.y = 100

    expect(garantirEspaco(doc, 50)).toBe(false)
    expect(doc.y).toBe(100)
  })

  it('quebra e começa a folha seguinte no topo quando o bloco não cabe', () => {
    const doc = documento()
    doc.y = LIMITE_CONTEUDO - 10

    expect(garantirEspaco(doc, 50)).toBe(true)
    expect(doc.y).toBeLessThan(LIMITE_CONTEUDO - 10)
  })

  it('o limite de conteúdo deixa a faixa do rodapé livre', () => {
    expect(LIMITE_CONTEUDO).toBeLessThan(841.89 - 50)
  })
})
