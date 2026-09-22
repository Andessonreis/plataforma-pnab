import { fio } from '@/lib/pdf/documento-oficial/tema'
import { COLORS, LARGURA_UTIL, MARGINS } from './tema'

/**
 * Blocos de conteúdo da versão 1: identificação do documento, divisor, título
 * de seção e aviso legal.
 *
 * O desenho é o do layout anterior — pares rótulo/valor em duas colunas com
 * fundo zebrado, seção marcada por um traço verde à esquerda e o aviso em
 * itálico miúdo fechando a peça.
 */

export interface LinhaInfo {
  label: string
  value: string
}

const LARGURA_ROTULO = 150
const LARGURA_VALOR = LARGURA_UTIL - LARGURA_ROTULO
const ALTURA_LINHA = 16
const RESPIRO_SECAO = 6

/**
 * Par rótulo/valor numa linha só.
 *
 * `ellipsis` só corta quando `height` também é passado — sem isso o PDFKit
 * ignora a truncagem e quebra o texto em quantas linhas precisar, enquanto
 * `doc.y` avança só a altura fixa: a linha seguinte sai desenhada por cima do
 * texto que devia ter sido cortado. É bloco de valor curto, por construção.
 */
function desenharLinhaInfo(doc: PDFKit.PDFDocument, linha: LinhaInfo, zebra: boolean): void {
  const y = doc.y

  if (zebra) {
    doc.rect(MARGINS.left, y - 1, LARGURA_UTIL, ALTURA_LINHA + 2).fill(COLORS.background)
  }

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.textLight)
    .text(linha.label, MARGINS.left + 4, y, {
      width: LARGURA_ROTULO, height: ALTURA_LINHA, ellipsis: true,
    })

  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.text)
    .text(linha.value || '—', MARGINS.left + LARGURA_ROTULO + 4, y, {
      width: LARGURA_VALOR - 8, height: ALTURA_LINHA, ellipsis: true,
    })

  doc.y = y + ALTURA_LINHA
}

/** Bloco de identificação do documento (edital, ano, totais, filtros). */
export function desenharBlocoInfo(doc: PDFKit.PDFDocument, linhas: LinhaInfo[]): void {
  linhas.forEach((linha, i) => desenharLinhaInfo(doc, linha, i % 2 === 0))
  doc.y += 2
}

/** Linha divisória fina entre blocos. */
export function desenharDivisor(doc: PDFKit.PDFDocument): void {
  doc.y += 3
  fio(doc, doc.y, { espessura: 0.3, cor: COLORS.border })
  doc.y += 4
}

/** Título de seção com o marcador verde à esquerda. */
export function desenharSecao(doc: PDFKit.PDFDocument, titulo: string): void {
  doc.y += RESPIRO_SECAO
  const y = doc.y

  doc.rect(MARGINS.left, y, 3, 12).fill(COLORS.brand)

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.brandDark)
    .text(titulo.toUpperCase(), MARGINS.left + 8, y + 1, { characterSpacing: 0.5 })

  doc.y = y + 14
}

/** Aviso legal que fecha o documento, separado do conteúdo por um fio. */
export function desenharAvisoLegal(doc: PDFKit.PDFDocument, texto: string): void {
  doc.y += 6
  doc.rect(MARGINS.left, doc.y, LARGURA_UTIL, 1).fill(COLORS.border)
  doc.y += 5

  doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(COLORS.textLight)
    .text(texto, MARGINS.left, doc.y, { width: LARGURA_UTIL, align: 'justify' })
}
