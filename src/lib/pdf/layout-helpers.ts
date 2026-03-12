import type PDFKit from 'pdfkit'
import { COLORS, MARGINS, CONTENT_WIDTH } from './shared'

/**
 * Adiciona um campo inline (label + valor na mesma linha).
 */
export function addInlineField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
): void {
  const labelWidth = 100

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.textLight)
    .text(`${label}:`, MARGINS.left, doc.y, { width: labelWidth, continued: true })

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(` ${value}`, { width: CONTENT_WIDTH - labelWidth })

  doc.moveDown(0.15)
}

/**
 * Adiciona dois campos lado a lado (layout 2 colunas).
 */
export function addTwoColumnRow(
  doc: PDFKit.PDFDocument,
  left: { label: string; value: string },
  right?: { label: string; value: string },
): void {
  const colWidth = (CONTENT_WIDTH - 20) / 2
  const startY = doc.y

  // Coluna esquerda
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text(left.label, MARGINS.left, startY)

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(left.value, MARGINS.left, doc.y, { width: colWidth })

  const leftEndY = doc.y

  // Coluna direita
  if (right) {
    const rightX = MARGINS.left + colWidth + 20

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.textLight)
      .text(right.label, rightX, startY)

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(right.value, rightX, doc.y, { width: colWidth })
  }

  doc.y = Math.max(leftEndY, doc.y) + 4
}

/**
 * Adiciona uma seção compacta (título sem underline largo).
 */
export function addCompactSection(doc: PDFKit.PDFDocument, title: string): void {
  doc.moveDown(0.4)

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.brandDark)
    .text(title, MARGINS.left)

  // Linha curta
  doc
    .moveTo(MARGINS.left, doc.y + 1)
    .lineTo(MARGINS.left + 80, doc.y + 1)
    .strokeColor(COLORS.brand)
    .lineWidth(0.75)
    .stroke()

  doc.moveDown(0.3)
}

/**
 * Adiciona o protocolo em destaque compacto (1 linha).
 */
export function addProtocolBadge(
  doc: PDFKit.PDFDocument,
  numero: string,
): void {
  const badgeHeight = 28
  const badgeY = doc.y

  doc
    .roundedRect(MARGINS.left, badgeY, CONTENT_WIDTH, badgeHeight, 4)
    .fill('#f0fdf4')

  doc
    .roundedRect(MARGINS.left, badgeY, CONTENT_WIDTH, badgeHeight, 4)
    .strokeColor(COLORS.brand)
    .lineWidth(0.5)
    .stroke()

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.brand)
    .text(`Protocolo: ${numero}`, MARGINS.left, badgeY + 8, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc.y = badgeY + badgeHeight + 8
}

/**
 * Adiciona aviso legal compacto no rodapé.
 */
export function addLegalNotice(doc: PDFKit.PDFDocument, text: string): void {
  doc.moveDown(0.6)

  doc
    .moveTo(MARGINS.left, doc.y)
    .lineTo(MARGINS.left + CONTENT_WIDTH, doc.y)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke()

  doc.moveDown(0.3)

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(COLORS.textLight)
    .text(text, MARGINS.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'justify',
    })
}
