import { COLORS, LARGURA_UTIL, MARGINS } from './tema'
import { garantirEspaco } from './pagina'

/**
 * Gráficos simples da versão 1, desenhados com retângulos: barras horizontais para
 * rankings e colunas para sequências (horários). Cada valor é escrito ao lado — a
 * forma ajuda a comparar, o número é o que vale em impressão em preto e branco.
 */

export interface ItemGrafico {
  rotulo: string
  valor: number
  /** Texto escrito junto da barra (ex.: "120 pessoas · 4 visitas"). */
  legenda: string
}

const ALTURA_BARRA = 7
const LINHA_BARRA = 14
const LARGURA_ROTULO = 130
const LARGURA_LEGENDA = 120
const ALTURA_COLUNAS = 48
const LARGURA_COLUNA_MAX = 34

/** Barras horizontais proporcionais ao maior valor; o rótulo à esquerda e a legenda à direita. */
export function desenharBarrasHorizontais(doc: PDFKit.PDFDocument, itens: ItemGrafico[], cor: string): void {
  const maior = Math.max(1, ...itens.map((i) => i.valor))
  const larguraMax = LARGURA_UTIL - LARGURA_ROTULO - LARGURA_LEGENDA - 12

  for (const item of itens) {
    garantirEspaco(doc, LINHA_BARRA)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.text)
      .text(item.rotulo, MARGINS.left + 4, y + 1, { width: LARGURA_ROTULO - 8, height: 11, ellipsis: true })

    const xBarra = MARGINS.left + LARGURA_ROTULO
    doc.rect(xBarra, y + 2, larguraMax, ALTURA_BARRA).fill(COLORS.background)
    doc.rect(xBarra, y + 2, Math.max(2, (item.valor / maior) * larguraMax), ALTURA_BARRA).fill(cor)

    doc.font('Helvetica').fontSize(8).fillColor(COLORS.text)
      .text(item.legenda, xBarra + larguraMax + 8, y + 1, { width: LARGURA_LEGENDA, height: 11, ellipsis: true })
    doc.y = y + LINHA_BARRA
  }
}

/** Colunas verticais lado a lado sobre uma linha de base; a mais alta ganha o tom escuro. */
export function desenharColunas(doc: PDFKit.PDFDocument, itens: ItemGrafico[], cor: string, corPico: string): void {
  const alturaTotal = ALTURA_COLUNAS + 26
  garantirEspaco(doc, alturaTotal)
  const maior = Math.max(1, ...itens.map((i) => i.valor))
  const passo = LARGURA_UTIL / itens.length
  const largura = Math.min(LARGURA_COLUNA_MAX, passo - 8)
  const base = doc.y + 14 + ALTURA_COLUNAS

  itens.forEach((item, i) => {
    const altura = Math.max(2, (item.valor / maior) * ALTURA_COLUNAS)
    const x = MARGINS.left + i * passo + (passo - largura) / 2
    doc.rect(x, base - altura, largura, altura).fill(item.valor === maior ? corPico : cor)
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.text)
      .text(item.legenda, x - 10, base - altura - 11, { width: largura + 20, align: 'center', lineBreak: false })
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.text)
      .text(item.rotulo, x - 10, base + 4, { width: largura + 20, align: 'center', lineBreak: false })
  })

  doc.rect(MARGINS.left, base, LARGURA_UTIL, 0.5).fill(COLORS.textLight)
  doc.y = base + 16
}

/** Barra única repartida em fatias, uma por situação; fatia zerada não aparece. */
export function desenharBarraEmpilhada(doc: PDFKit.PDFDocument, fatias: { valor: number; cor: string }[]): void {
  const total = fatias.reduce((s, f) => s + f.valor, 0)
  if (total === 0) return
  const y = doc.y + 2
  let x = MARGINS.left
  for (const fatia of fatias.filter((f) => f.valor > 0)) {
    const largura = (fatia.valor / total) * LARGURA_UTIL
    doc.rect(x, y, largura, 12).fill(fatia.cor)
    x += largura
  }
  doc.y = y + 18
}
